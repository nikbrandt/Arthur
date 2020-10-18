const fs = require('fs');
const http = require('http');
const https = require('https');
const querystring = require('querystring');

const ytdl = require('ytdl-core');
const fileType = require('file-type');
const ytSearch = require('ytsr');
const ytPlaylist = require('ytpl');
const Discord = require('discord.js');

const soundcloud = require('./soundcloud.js');
const { timeString } = require('./Util.js');

const streamOptions = { volume: false, passes: 2, bitrate: 'auto', highWaterMark: 50 };
const fileStreamOptions = { volume: false, passes: 2, bitrate: 'auto', highWaterMark: 1 << 27 };

const supportedFileTypes = [ 'mp3', 'ogg', 'aac', 'm4a', 'mp4', 'mov', 'flac', 'ac3', 'wav', 'bcstm' ];
const supportedFileTypesString = '`' + supportedFileTypes.join('`, `') + '`';

const videoYTRegex = /^(?:https?:\/\/)?(?:www\.|m\.|music\.)?(?:youtube\.com\/watch\?.*?v=|youtu\.be\/|youtube\.com\/v\/|youtube\.com\/embed\/)([A-z0-9_-]{11})([?&].*?=.*)?$/;
const playlistYTRegex = /^(?:https?:\/\/)?(?:www\.|m\.|music\.)?(?:youtube\.com\/)(?:playlist|embed\/videoseries)(?:\?list=([A-z0-9_-]{10,}))$/;
const generalSCRegex = /^(?:https?:\/\/)?(?:www\.)?(?:m\.)?soundcloud.com\/[A-Za-z-_0-9]{3,25}\/[^/\n\s]+?(?:\?(.+))?$/;
const playlistSCRegex = /^(?:https?:\/\/)?(?:www\.)?(?:m\.)?soundcloud.com\/[A-Za-z-_0-9]{3,25}\/sets\/[^/\n\s]{1,100}$/;
const songRegex = new RegExp(`^https?:\\/\\/.+\\/([^/]+)\\.(${supportedFileTypes.join('|')})$`);

const reactionFilter = reaction => [ '👍', '⏩', '⏹', '🔁', '🎶' ].includes(reaction.emoji.name);

const soundEffectLengths = { // in seconds, for queue length calculation
	airhorn: 2,
	airhorns: 3,
	oof: 1,
	oofcat: 17,
	rickroll: 17,
	sadoof: 22
};

// returns Promise<boolean>, true if url links to valid file type, false otherwise
function testIfValidFileType(url) {
	return new Promise((resolve) => {
		if (!url) return resolve(false);
		else if (url.startsWith('https')) https.get(url, callback);
		else if (url.startsWith('http')) http.get(url, callback);
		else return resolve(false);

		function callback(response) {
			if (response.statusCode !== 200) return resolve(false);

			let totalBytes = 0;
			let chunkArray = [];

			response.on('data', (chunk) => {
				totalBytes += chunk.length;
				chunkArray.push(chunk);

				if (totalBytes >= fileType.minimumBytes) {
					const section = Buffer.concat(chunkArray);
					response.destroy();

					const type = fileType(section);
					if (!type && url.endsWith('bcstm')) return resolve(true);
					if (!type) return resolve(false);
					return resolve(supportedFileTypes.includes(type.ext));
				}
			});
		}
	});
}

const Music = {
	/**
	 * Play the next song in the queue
	 * @param {Guild} guild The guild to play a song in
	 * @param {boolean} [first] Whether or not this is the first song
	 * @param {number} [retry] If song is being retried due to error, retry attempt number
	 * @returns {Promise<void>}
	 */
	next: async (guild, first, retry) => {
		if (retry) first = true;
		let notify = await sql.get(`SELECT npNotify FROM guildOptions WHERE guildID = '${guild.id}'`);
		if (!notify) notify = false;
		else notify = notify.npNotify === 'true';

		let music = guild.music;

		if (!music.queue) {
			if (guild.voice && guild.voice.connection) guild.voice.connection.disconnect();
			return;
		}

		if (!first) {
			if (music.loop) {
				let first = music.queue[0];
				if (first.voteSkips) first.voteSkips = undefined;
				music.queue.push(first);
			}

			music.queue = music.queue.slice(1);
		}

		if (music.queue.length === 0) {
			if (guild.voice && guild.voice.connection) guild.voice.connection.disconnect();
			guild.music = {};
			return;
		}

		guild.music = music;

		setTimeout(async () => {
			if (!guild.voice || !guild.voice.connection) {
				guild.music = {};
				return;
			}

			console.log(`In guild ${guild.id} playing type ${music.queue[0].type} with id ${music.queue[0].id}`);
			
			if (notify && music.queue[0].embed && !first) {
				let embed = music.queue[0].embed;
				if (!embed.author) embed.author = {};
				embed.author.name = i18n.get('struct.music.now_playing', guild);

				let messageCallback = msg => {
					Music.addReactionCollector(msg, msg.client, music.queue[0].ms);
				};

				if (music.textChannel // check if last message was a "Added to queue" message; if so, edit that one instead of sending a new one to notify
					&& music.textChannel.lastMessage
					&& music.textChannel.lastMessage.author.id === guild.client.user.id
					&& music.textChannel.lastMessage.embeds.length
					&& music.textChannel.lastMessage.embeds[0].description
					&& music.textChannel.lastMessage.embeds[0].description === music.queue[0].embed.description) music.textChannel.lastMessage.edit({ embed }).then(messageCallback);
				else music.textChannel.send({ embed }).then(messageCallback);
			}
			
			switch (music.queue[0].type) {
				case 1: { // youtube
					let stream = ytdl(music.queue[0].id, { quality: 'highestaudio', highWaterMark: 1 << 23, requestOptions: { maxRedirects: 10 } });
	
					if (!guild.voice || !guild.voice.connection) {
						guild.music = {};
						return;
					}
					
					let dispatcher = guild.voice.connection.play(stream, streamOptions);
	
					dispatcher.once('finish', () => {
						Music.next(guild);
					});
	
					dispatcher.once('start', () => {
						guild.voice.connection.player.streamingData.pausedTime = 0;
						guild.music.startTime = Date.now();
					});
	
					dispatcher.on('error', err => {
						let toString = err.toString();
						
						if (toString.includes('input stream: Too many redirects')
						|| toString.includes('input stream: Error parsing config: Unexpected token ; in JSON at position'))
							return setTimeout(() => {
								if (retry > 4) Music.next(guild);
								else Music.next(guild, true, retry + 1);
							}, 500);

						if (toString.includes('This video requires payment')) {
							music.textChannel.send(i18n.get('struct.music.video_requires_payment', guild, { video: music.queue[0].meta.title.split(' (').slice(0, -1).join(' (') }));
							return Music.next(guild);
						}

						if (toString.includes('No such format found: highestaudio')) {
							music.textChannel.send(i18n.get('struct.music.no_audio_track', guild, { video: music.queue[0].meta.title.split(' (').slice(0, -1).join(' (') }));
							return Music.next(guild);
						}
						
						if (toString.includes('This video is unavailable')
						|| toString.includes('Video unavailable')) {
							music.textChannel.send(i18n.get('struct.music.video_unavailable', guild, { video: music.queue[0].meta.title.split(' (').slice(0, -1).join(' (') }));
							return Music.next(guild);
						}

						guild.client.errorLog("Error playing music from YouTube", { stack: err.stack ? err.stack : err, code: `Video ID ${music.queue[0].id} after ${Math.round(dispatcher.totalStreamTime / 1000)} seconds` });
						Music.next(guild);
					});
					
					break;
				}
				case 4: { // from URL
					let dispatcher = guild.voice.connection.play(music.queue[0].id, fileStreamOptions);

					dispatcher.once('finish', () => {
						Music.next(guild);
					});

					dispatcher.once('start', () => {
						guild.voice.connection.player.streamingData.pausedTime = 0;
						guild.music.startTime = Date.now();
					});

					dispatcher.on('error', err => {
						guild.client.errorLog("Error playing music from URL", { stack: err.stack ? err.stack : err, code: `After ${Math.round(dispatcher.totalStreamTime / 1000)} seconds, URL:` + music.queue[0].id });
						Music.next(guild);
					});
					
					break;
				}
				case 3: { // local file
					const stream = fs.createReadStream(`../media/sounds/${music.queue[0].id}.mp3`);
					let dispatcher = guild.voice.connection.play(stream, streamOptions);
	
					dispatcher.once('finish', () => {
						Music.next(guild);
					});
	
					dispatcher.once('start', () => {
						guild.voice.connection.player.streamingData.pausedTime = 0;
						guild.music.startTime = Date.now();
					});
	
					dispatcher.on('error', err => {
						guild.client.errorLog("Error playing music from local file", { stack: err.stack ? err.stack : err, code: `File ${music.queue[0].id} after ${Math.round(dispatcher.totalStreamTime / 1000)} seconds` });
						Music.next(guild);
					});
					
					break;
				}
				case 5: { // soundcloud
					let url = await soundcloud(music.queue[0].meta.id);

					if (!guild.voice) return;
					let dispatcher = guild.voice.connection.play(url, streamOptions);

					dispatcher.once('finish', () => {
						Music.next(guild);
						setTimeout(() => {
							if (guild.voice && guild.voice.connection && !guild.voice.connection.dispatcher) Music.next(guild);
						}, 10000);
					});

					dispatcher.once('start', () => {
						guild.voice.connection.player.streamingData.pausedTime = 0;
						guild.music.startTime = Date.now();
					});

					dispatcher.on('error', err => {
						guild.client.errorLog("Error playing music from Soundcloud", { stack: err.stack ? err.stack : err, code: `Soundcloud ID ${music.queue[0].id} after ${Math.round(dispatcher.totalStreamTime / 1000)} seconds` });
						Music.next(guild);
					});
				}
			}
		}, 50);
	},

	likedArray: async () => {
		let rows = await sql.all('SELECT DISTINCT S.type, S.id, S.url, S.title, S.queueName, C.count FROM musicLikes S INNER JOIN (SELECT id, count(id) as count FROM musicLikes GROUP BY id) C ON S.id = C.id');

		rows.sort((a, b) => {
			return b.count - a.count;
		});

		return rows;
	},

	parseMessage: (message, args, suffix) => {
		return new Promise(async (resolve, reject) => {
			let type = 1;
			let id;

			message._ = (string, variables) => {
				return i18n.get('struct.music.' + string, message, variables);
			};

			if (message.attachments.size) {
				type = 4;
				id = message.attachments.first().url;

				if (!supportedFileTypes.some(fileType => id.toLowerCase().endsWith('.' + fileType))) return reject(message._('invalid_file_type', { filetypes: supportedFileTypesString }));
				if (message.attachments.first().size < 25000) return reject(message._('file_too_small'));
				if (!(await testIfValidFileType(id))) return reject(message._('invalid_file_type', { filetypes: supportedFileTypesString }));

				resolve( {
					id: id,
					type: type
				} );
			} else if (args[0] === i18n.get('commands.likedlb.liked', message) || args[0] === i18n.get('commands.likedlb.likes', message)) {
				let array = await sql.all(`SELECT type, id FROM musicLikes WHERE userID = '${message.author.id}'`);
				if (!array || !array.length) return reject(message._('no_liked_songs'));
				let num;

				if (args[1] === message._('random')) num = Math.ceil(Math.random() * array.length);
				else {
					if (!args[1]) return reject(message._('no_song_specified'));
					num = parseInt(args[1]);
					if (!num) return reject(i18n.get('parsing.invalid_number', message));
					if (num < 1) return reject(message._('negative_number'));
					if (num > array.length) return reject(message._('number_too_large'));
				}

				if (!array[num - 1]) return reject(message._('could_not_find_song'));

				type = array[num - 1].type;
				id = array[num - 1].id;

				resolve( {
					id: id,
					type: type
				} );
			} else if (args[0] === message._('top')) {
				let array = await Music.likedArray();
				let num;

				if (args[1] === message._('random')) num = Math.ceil(Math.random() * array.length);
				else {
					if (!args[1]) return reject(message._('no_song_specified'));
					num = parseInt(args[1]);
					if (!num) return reject(i18n.get('parsing.invalid_number', message));
					if (num < 1) return reject(message._('negative_number'));
					if (num > array.length) return reject(message._('number_too_large_lb'));
				}

				let obj = array[num - 1];
				if (!obj) return reject(message._('could_not_find_song'));
				type = obj.type;
				id = obj.id;

				resolve( {
					id: id,
					type: type
				} );
			} else if (args[0] === message._('file')) {
				type = 3;
				let files = fs.readdirSync('../media/sounds');
				files = files.map(f => f.replace(/\.mp3/g, ''));

				if (!args[1]) return reject(message._('no_file_specified', { files: files.map(f => '`' + f + '`').join(message._('separator') + ' ') }));
				if (!files.includes(args[1])) return reject(message._('invalid_file', { files: files.map(f => '`' + f + '`').join(message._('separator') + ' ') }));

				id = args[1];

				resolve ( {
					id: id,
					type: type
				} );
			} else if (videoYTRegex.test(args[0])) {
				let [, id, query] = args[0].match(videoYTRegex);

				let list;
				if (query) {
					if (query.startsWith('?') || query.startsWith('&')) query = query.slice(1);
					query = querystring.parse(query);
					if (query.list) list = query.list;
				}

				resolve ( {
					id: id,
					type: type,
					list: list
				} );
			} else if (playlistYTRegex.test(args[0])) {
				id = args[0].match(playlistYTRegex)[1];

				resolve ( {
					id: id,
					type: 1.5
				} );
			} else if (playlistSCRegex.test(args[0])) {
				id = args[0];

				resolve( {
					id: id,
					type: 5.5
				} )
			} else if (generalSCRegex.test(args[0])) {
				type = 5;
				id = args[0];
				let list;

				let matched = args[0].match(generalSCRegex);
				if (matched[1]) {
					let query = querystring.parse(matched[1]);
					if (query.in) list = query.in;
				}

				resolve ( {
					id, type, list
				} );
			} else if (supportedFileTypes.some(fileType => args[0].toLowerCase().endsWith('.' + fileType))) {
				if (!songRegex.test(args[0])) return reject(message._('invalid_url'));
				if (!(await testIfValidFileType(args[0]))) return reject(message._('invalid_file_type', { filetypes: supportedFileTypesString }));

				type = 4;
				id = args[0];

				resolve ( {
					id: id,
					type: type
				} );
			} else { //  if (!YTRegex.test(args[0]))
				if (suffix.includes('-s') || suffix.includes('-soundcloud')) {
					let term = suffix.replace(/-s(oundcloud)?/g, '');

					let result = await soundcloud.search(term).catch(err => {
						return reject(err);
					});
					
					if (!result) return reject(message._('no_results'));

					return resolve ( {
						id: result.permalink_url,
						type: 5
					} );
				}

				let results = await Music.attemptYTSearch(suffix, message.client.errorLog);

				if (!results) return soundcloud.search(suffix).then(result => {
					if (!result) return reject(message._('no_results'));

					resolve ( {
						id: result.permalink_url,
						type: 5
					});
				}).catch(() => {
					reject(message._('no_results'));
				});

				resolve ( {
					id: results,
					type: type
				} );
			}
		})
	},

	getInfo: (type, id, message, client, title) => {
		return new Promise(async (resolve, reject) => {
			message._ = (string, variables) => {
				return i18n.get('struct.music.' + string, message, variables);
			};

			switch (type) {
				case 1: {// youtube
					let info = await ytdl.getBasicInfo(id).catch(() => {
						return reject(message._('could_not_get_info'));
					});

					if (!info) return reject(message._('could_not_get_info'));

					if (info.videoDetails.isLiveContent) return reject(message._('livestream'));
					if (info.videoDetails.lengthSeconds < 5) return reject(message._("song_too_short"));

					let time = timeString(parseInt(info.videoDetails.lengthSeconds), message);

					let author = info.videoDetails.author.name;
					if (author) author = Discord.Util.escapeMarkdown(author);

					info.videoDetails.title = Discord.Util.escapeMarkdown(info.videoDetails.title);
					resolve({
						meta: {
							url: `https://youtu.be/${id}`,
							title: `${info.videoDetails.title} (${time})`,
							queueName: `[${info.videoDetails.title}](https://youtu.be/${id}) - ${time}`,
							length: parseInt(info.videoDetails.lengthSeconds)
						},
						embed: {
							author: {
								name: title,
								icon_url: info.videoDetails.author.avatar
							},
							color: 0xff0000,
							description: `[${info.videoDetails.title}](https://youtu.be/${id})\n${i18n.get('commands.nowplaying.by', message)} [${author}](${info.videoDetails.author.channel_url})\n${message._('length')}: ${time}`,
							thumbnail: {
								url: info.videoDetails.thumbnail.thumbnails.find(thumb => thumb.width > 300) ? info.videoDetails.thumbnail.thumbnails.find(thumb => thumb.width > 300).url : info.videoDetails.thumbnail.thumbnails[0].url
							},
							footer: {
								text: i18n.get('commands.nowplaying.footer', message, {tag: message.author.tag})
							}
						},
						ms: info.videoDetails.lengthSeconds * 1000,
						requester: message.author.id
					});
					break;
				} case 1.5: // youtube playlist
					let out = {};
					let res = await ytPlaylist(id).catch(() => {});

					if (!res || !res.items) return reject(message._('invalid_playlist'));

					if (res.items.length > 200) return reject(message._('playlist_too_long'));

					if (message.guild.music && message.guild.music.queue && message.guild.music.queue.length)
						res.items = res.items.filter(video => video.id !== message.guild.music.queue[message.guild.music.queue.length - 1].id);

					let errors = 0;
					let nowPlaying = i18n.get('struct.music.now_playing', message);
					let items = await Promise.all(res.items.map(video => Music.getInfo(1, video.id, message, message.client, nowPlaying)
						.catch((e) => { console.error(e); errors++; })));

					if (errors >= res.items.length) return reject(message._('error_loading_playlist_songs'));

					for (let i = 0; i < items.length; i++) {
						if (!items[i]) continue;
						out[res.items[i].id] = items[i];
					}

					resolve(out);

					break;
				case 3: // sound effect
					resolve({
						meta: {
							title: `${message._('sound_effect')} - ${id}`,
							queueName: `${message._('sound_effect')} - ${id}`,
							url: 'https://github.com/Gymnophoria/Arthur',
							length: soundEffectLengths[id.toLowerCase()]
						},
						ms: 30000
					});

					break;
				case 4: // custom file
					let filename = id.match(songRegex)[1];
					if (!filename) return reject(message._('invalid_url'));
					filename = Discord.Util.escapeMarkdown(filename);

					resolve({
						meta: {
							title: filename,
							queueName: `[${filename}](${id})`,
							url: id,
							length: 60 * 3 // can't accurately estimate music file length without complicated calculation
						},
						embed: {
							author: {
								name: title
							},
							color: 0x7289DA,
							description: `[${filename}](${id})`,
							footer: {
								text: message._('file_footer', { tag: message.author.tag })
							}
						},
						ms: 180000
					});

					break;
				case 5: {// soundcloud
					let meta = await soundcloud.getInfo(id).catch(() => {
						return reject(message._('could_not_get_info'));
					});

					if (!meta) return reject(message._('could_not_get_info'));

					resolve(soundcloud.constructInfoFromMeta(meta, message, title));

					break;
				} case 5.5: {
					let meta = await soundcloud.getInfo(id).catch(() => {
						return reject(message._('could_not_get_info'));
					});

					if (!meta || !meta.tracks || !meta.tracks[0]) return reject(message._('invalid_playlist'));

					if (message.guild.music && message.guild.music.queue && message.guild.music.queue.length)
						meta.tracks = meta.tracks.filter(track => track.permalink_url !== message.guild.music.queue[message.guild.music.queue.length - 1].meta.url);

					let out = {};
					meta.tracks.forEach(track => {
						let info = soundcloud.constructInfoFromMeta(track, message, title);
						if (!info) return;
						out[track.permalink_url] = info;
					});

					resolve(out);

					break;
				}
			}
		});
	},

	addReactionCollector: async (message, client, time) => {
		if (!message) return;
		if (!message.channel.permissionsFor(message.guild.me).has('MANAGE_MESSAGES')) return;

		const collector = message.createReactionCollector(reactionFilter, { time: time ? time + 10000 : 600000 });

		collector.on('collect', async reaction => {
			let user = reaction.users.cache.filter(user => user.id !== client.user.id).first();
			if (!user) return;

			let fakeMessage = Object.assign(Object.create(Object.getPrototypeOf(message)), message); // copy of `message`
			fakeMessage.author = user;
			fakeMessage.member = message.guild.members.cache.get(user.id) || await message.guild.members.fetch(user);
			fakeMessage.client = client;
			let permLevel = client.permLevel(fakeMessage);

			switch (reaction.emoji.name) {
				case '👍':
					fakeMessage.__ = (string, variables) => {
						return i18n.get('commands.like.' + string, message, variables);
					};
					
					client.commands.get('like').run(fakeMessage, [], '', client);
					break;
				case '⏩':
					fakeMessage.__ = (string, variables) => {
						return i18n.get('commands.skip.' + string, message, variables);
					};
					
					client.commands.get('skip').run(fakeMessage, [], '', 'ded', permLevel);
					break;
				case '⏹':
					fakeMessage.__ = (string, variables) => {
						return i18n.get('commands.stop.' + string, message, variables);
					};
					
					client.commands.get('stop').run(fakeMessage, [], '', 'hi mom', permLevel);
					break;
				case '🔁':
					fakeMessage.__ = (string, variables) => {
						return i18n.get('commands.loop.' + string, message, variables);
					};
					
					client.commands.get('loop').run(fakeMessage, [], '', '', permLevel);
					break;
				case '🎶':
					fakeMessage.__ = (string, variables) => {
						return i18n.get('commands.queue.' + string, message, variables);
					};
					
					client.commands.get('queue').run(fakeMessage, []);
					break;
			}

			reaction.users.remove(user).catch(err => {
				if (!err.includes('Missing Access')) client.errorLog('Failed to remove reaction from music collector', err);
			})
		});

		try {
			await message.react('👍');
			await message.react('⏩');
			await message.react('⏹');
			await message.react('🔁');
			await message.react('🎶');
		} catch (e) {}
	},

	calculateQueueLength: (guild) => {
		let ellapsedTime = Music.calculateEllapsedTime(guild);
		let queueLength = guild.music.queue.reduce((accum, current) => accum + parseInt(current.meta.length), 0);

		let length = queueLength - ellapsedTime;
		if (length < 0) return 0;
		return length;
	},

	calculateEllapsedTime: (guild) => {
		let time = Date.now() - guild.music.startTime;
		if (guild.music.pauseTime) time -= Date.now() - guild.music.pauseTime;
		return Math.floor(time / 1000);
	},

	attemptYTSearch: (term, errorLog, retry = 0) => {
		return new Promise(async resolve => {
			if (retry > 4) return resolve(false);

			await new Promise(res => {
				setTimeout(res, 250);
			});

			const options = {
				limit: 1,
				nextpageRef: `https://www.youtube.com/results?search_query=${encodeURIComponent(term)}&sp=EgIQAQ%253D%253D`
			};

			let results;
			let err;

			try {
				results = await ytSearch(null, options);
			} catch (error) {
				err = error;
			}

			if (err && err.toString().startsWith('SyntaxError')) return resolve(await Music.attemptYTSearch(term, errorLog, retry + 1));

			if (err || !results || !results.items || !results.items[0] || !results.items[0].link) {
				let error;
				if (err) error = err;
				else if (!results) error = 'No results.';
				else if (!results.items) error = 'No items array.';
				else if (!results.items[0]) error = 'No elements in the items array.';
				else error = 'No link in first element of array.';
				errorLog('No YouTube results found.', `Query: ${term}\n${error}`);

				return resolve(false);
			}

			let id = results.items[0].link.slice(-11);
			resolve(id);
		});
	}
};

module.exports = Music;
