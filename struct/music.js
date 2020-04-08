const fs = require('fs');
const http = require('http');
const https = require('https');
const ytdl = require('ytdl-core');
const request = require('request');
const fileType = require('file-type');
const search = require('youtube-search');
const Discord = require('discord.js');

const soundcloud = require('./soundcloud');

const YTRegex = /^(https?:\/\/)?(www\.|m\.|music\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/v\/|youtube\.com\/embed\/)([A-z0-9_-]{11})([&?].*)?$/;
const soundcloudRegex = /^(https:\/\/)?soundcloud.com\/.+\/[^/]+$/;
const reactionFilter = reaction => ['👍', '⏩', '⏹', '🔁', '🎶'].includes(reaction.emoji.name);
const streamOptions = { volume: false, passes: 2, bitrate: 'auto', highWaterMark: 50 };

const supportedFileTypes = [ 'mp3', 'ogg', 'aac', 'm4a', 'mp4', 'mov', 'flac', 'ac3', 'wav' ];
const songRegex = new RegExp(`^https?:\\/\\/.+\\/([^/]+)\\.(${supportedFileTypes.join('|')})$`);
const supportedFileTypesString = '`' + supportedFileTypes.join('`, `') + '`';

function secSpread(sec) {
	let hours = Math.floor(sec / 3600);
	let mins = Math.floor((sec - hours * 3600) / 60);
	let secs = sec - (hours * 3600 + mins * 60);
	return {
		h: hours,
		m: mins,
		s: secs
	}
}

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
					return resolve(supportedFileTypes.includes(type.ext));
				}
			});
		}
	});
}

const Music = {
	/**
	 * Play the next song in the queue
	 * @param {Discord.Guild} guild The guild to play a song in
	 * @param {boolean} [first] Whether or not this is the first song
	 * @returns {Promise<void>}
	 */
	next: async (guild, first) => {
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
				music.textChannel.send({ embed }).then(msg => {
					Music.addReactionCollector(msg, msg.client, music.queue[0].ms);
				});
			}
			
			switch (music.queue[0].type) {
				case 1: { // youtube
					const stream = ytdl(music.queue[0].id, { quality: 'highestaudio', highWaterMark: 131072 });
	
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
					});
	
					dispatcher.on('error', err => {
						console.warn(`error playing music: ${err}`);
						guild.client.errorLog("Error playing music from YouTube", err.stack ? err.stack : err, `Video ID ${music.queue[0].id} after ${Math.round(dispatcher.totalStreamTime / 1000)} seconds`);
						Music.next(guild);
					});
					
					break;
				}
				case 4: { // from URL
					let date = Date.now();
					let rng = Math.floor(Math.random() * 10000);
					let file = `../media/temp/${rng}-${date}.${music.queue[0].id.match(/\.([^.]+)$/)[1]}`;
	
					const r = request(music.queue[0].id, (err) => {
						if (err) return Music.next(guild);
					}).pipe(fs.createWriteStream(file));
	
					r.on('finish', () => {
						const stream = fs.createReadStream(file);
						let dispatcher = guild.voice.connection.play(stream, streamOptions);
	
						dispatcher.once('finish', () => {
							fs.unlinkSync(file);
							Music.next(guild);
						});
	
						dispatcher.once('start', () => {
							guild.voice.connection.player.streamingData.pausedTime = 0;
						});
	
						dispatcher.on('error', err => {
							console.warn(`error playing music: ${err}`);
							guild.client.errorLog("Error playing music from URL", err.stack ? err.stack : err, `After ${Math.round(dispatcher.totalStreamTime / 1000)} seconds, URL:` + music.queue[0].id);
							Music.next(guild);
						});
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
					});
	
					dispatcher.on('error', err => {
						console.warn(`error playing music: ${err}`);
						guild.client.errorLog("Error playing music from local file", err.stack ? err.stack : err, `File ${music.queue[0].id} after ${Math.round(dispatcher.totalStreamTime / 1000)} seconds`);
						Music.next(guild);
					});
					
					break;
				}
				case 5: { // soundcloud
					let id = '' + Date.now() + guild.id;
					let url = await soundcloud(music.queue[0].meta.id);
					let writeStream = request(url).pipe(fs.createWriteStream(`../media/temp/${id}.mp3`));
	
					writeStream.on('finish', () => {
						setTimeout(() => {
							let scStream = fs.createReadStream(`../media/temp/${id}.mp3`);
							if (!guild.voice) return;
							let dispatcher = guild.voice.connection.play(scStream, streamOptions);
	
							dispatcher.once('finish', () => {
								fs.unlinkSync(`../media/temp/${id}.mp3`);
								Music.next(guild);
								setTimeout(() => {
									if (guild.voice && guild.voice.connection && !guild.voice.connection.dispatcher) Music.next(guild);
								}, 10000);
							});
	
							dispatcher.once('start', () => {
								guild.voice.connection.player.streamingData.pausedTime = 0;
							});
	
							dispatcher.on('error', err => {
								console.warn(`error playing music: ${err}`);
								guild.client.errorLog("Error playing music from Soundcloud", err.stack ? err.stack : err, `Soundcloud ID ${music.queue[0].id} after ${Math.round(dispatcher.totalStreamTime / 1000)} seconds`);
								Music.next(guild);
							});
						}, 100);
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

	parseMessage: (message, args, suffix, client) => {
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
			} else if (YTRegex.test(args[0])) {
				id = args[0].match(YTRegex)[4];

				resolve ( {
					id: id,
					type: type
				} );
			} else if (soundcloudRegex.test(args[0])) {
				type = 5;
				id = args[0];

				resolve ( {
					id, type
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
				let youtubeSearch = {
					maxResults: 1,
					key: client.config.ytkey,
					type: 'video'
				};

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

				search(suffix, youtubeSearch, (err, results) => {
					if (err || !results || !results[0]) {
						return soundcloud.search(suffix).then(result => {
							if (!result) return reject(message._('no_results'));
							
							resolve ( {
								id: result.permalink_url,
								type: 5
							});
						}).catch(() => {
							reject(message._('no_results'));
						});
					}

					id = results[0].id;

					resolve ( {
						id: id,
						type: type
					} );
				});
			}
		})
	},

	getInfo: (type, id, message, client, title) => {
		return new Promise(async (resolve, reject) => {
			message._ = (string, variables) => {
				return i18n.get('struct.music.' + string, message, variables);
			};

			switch (type) {
				case 1: // youtube
					let info = await ytdl.getInfo(id).catch(() => {
						return reject(message._('could_not_get_info'));
					});
					if (!info) return reject(message._('could_not_get_info'));
					if (info.livestream === '1' || info.live_playback === '1' || info.length_seconds > 7200 ) return reject(info.length_seconds > 7200 ? message._('song_too_long') : message._('livestream'));
					if (info.length_seconds < 5) return reject(message._("song_too_short"));

					let secObj = secSpread(info.length_seconds);
					let secString = `${secObj.h ? `${secObj.h}${i18n.get('time.abbreviations.hours', message)} ` : ''}${secObj.m ? `${secObj.m}${i18n.get('time.abbreviations.minutes', message)} ` : ''}${secObj.s}${i18n.get('time.abbreviations.seconds', message)}`;
					let thumbnail;
					
					try {
						thumbnail = info.thumbnail_url || info.player_response.videoDetails.thumbnail.thumbnails[0].url
					} catch (e) { }

					info.title = Discord.Util.escapeMarkdown(info.title);
					info.author.name = info.author.name ? Discord.Util.escapeMarkdown(info.author.name) : undefined;
					resolve({
						meta: {
							url: `https://youtu.be/${id}`,
							title: `${info.title} (${secString})`,
							queueName: `[${info.title}](https://youtu.be/${id}) - ${secString}`
						},
						embed: {
							author: {
								name: title,
								icon_url: info.author.avatar
							},
							color: 0xff0000,
							description: `[${info.title}](https://youtu.be/${id})\n${i18n.get('commands.nowplaying.by', message)} [${info.author.name}](${info.author.channel_url})\n${message._('length')}: ${secString}`,
							thumbnail: {
								url: thumbnail
							},
							footer: {
								text: i18n.get('commands.nowplaying.footer', message, { tag: message.author.tag })
							}
						},
						ms: info.length_seconds * 1000
					});
					break;
				case 3: // sound effect
					resolve({
						meta: {
							title: `${message._('sound_effect')} - ${id}`,
							queueName: `${message._('sound_effect')} - ${id}`,
							url: 'https://github.com/Gymnophoria/Arthur'
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
							url: id
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
				case 5: // soundcloud
					let meta = await soundcloud.getInfo(id).catch(err => {
						return reject(message._('could_not_get_info'));
					});
					
					if (!meta) return reject(message._('could_not_get_info'));
					if (meta.duration > 7200000) return reject (message._('song_too_long'));

					let timeObj = secSpread(Math.round(meta.duration / 1000));
					let timeString = `${timeObj.h ? `${timeObj.h}${i18n.get('time.abbreviations.hours', message)} ` : ''}${timeObj.m ? `${timeObj.m}${i18n.get('time.abbreviations.minutes', message)} ` : ''}${timeObj.s}${i18n.get('time.abbreviations.seconds', message)}`;

					meta.title = Discord.Util.escapeMarkdown(meta.title);
					meta.user.username = Discord.Util.escapeMarkdown(meta.user.username);
					resolve ({
						meta: {
							url: id,
							title: `${meta.title} (${timeString})`,
							queueName: `[${meta.title}](${id}) - ${timeString}`,
							id: meta.id
						},
						embed: {
							author: {
								name: title,
								icon_url: meta.user.avatar_url
							},
							color: 0xff8800,
							description: `[${meta.title}](${id})\n${i18n.get('commands.nowplaying.by', message)} [${meta.user.username}](${meta.user.permalink_url})\n${message._('length')}: ${timeString}`,
							thumbnail: {
								url: meta.artwork_url
							},
							footer: {
								text: i18n.get('commands.nowplaying.footer', message, { tag: message.author.tag })
							}
						},
						ms: meta.duration
					});
					break;
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

			let fakeMessage = message;
			fakeMessage.author = user;
			fakeMessage.member = message.guild.members.cache.get(user.id) || await message.guild.members.fetch(user);
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
				console.error('failed to remove reaction; \n' + err.stack);
			})
		});

		try {
			await message.react('👍');
			await message.react('⏩');
			await message.react('⏹');
			await message.react('🔁');
			await message.react('🎶');
		} catch (e) {}
	}
};

module.exports = Music;
