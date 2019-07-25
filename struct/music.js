const fs = require('fs');
const http = require('http');
const https = require('https');
const sql = require('sqlite');
const ytdl = require('ytdl-core');
const request = require('request');
const fileType = require('file-type');
const search = require('youtube-search');

const soundcloud = require('./soundcloud');

const YTRegex = /^(https?:\/\/)?(www\.|m\.|music\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/v\/|youtube\.com\/embed\/)([A-z0-9_-]{11})([&?].*)?$/;
const soundcloudRegex = /^(https:\/\/)?soundcloud.com\/.+\/[^/]+$/;
const reactionFilter = reaction => ['👍', '⏩', '⏹', '🔁', '🎶'].includes(reaction.emoji.name);
const streamOptions = { volume: 0.3, passes: 2, bitrate: 'auto' };

const supportedFileTypes = [ 'mp3', 'ogg', 'aac', 'm4a', 'mp4', 'mov' ];
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
	 * @param {Guild} guild The guild to play a song in
	 * @param {boolean} [first] Whether or not this is the first song
	 * @returns {Promise<void>}
	 */
	next: async (guild, first) => {
		let notify = await sql.get(`SELECT npNotify FROM guildOptions WHERE guildID = '${guild.id}'`);
		if (!notify) notify = 'false';
		else notify = notify.npNotify;

		let music = guild.music;

		if (!music.queue) {
			if (guild.voiceConnection) guild.voiceConnection.disconnect();
			return;
		}

		if (!first) {
			if (music.loop) {
				let first = music.queue[0];
				if (first.voteskips) first.voteskips = undefined;
				music.queue.push(first);
			}

			music.queue = music.queue.slice(1);
		}

		if (music.queue.length === 0) {
			if (guild.voiceConnection) guild.voiceConnection.disconnect();
			guild.music = {};
			return;
		}

		guild.music = music;

		setTimeout(async () => {
			let dispatcher;

			if (!guild.voiceConnection) {
				guild.music = {};
				return;
			}

			if (notify === 'true' && music.queue[0].embed && !first) {
				let embed = music.queue[0].embed;
				if (!embed.author) embed.author = {};
				embed.author.name = i18n.get('struct.music.now_playing', guild);
				music.textChannel.send({ embed }).then(msg => {
					Music.addReactionCollector(msg, msg.client, music.queue[0].ms);
				});
			}
			
			if (music.queue[0].type === 1) { // youtube
				const stream = ytdl(music.queue[0].id, { quality: 'highestaudio' });

				if (!guild.voiceConnection) {
					guild.music = {};
					return;
				}
				
				dispatcher = guild.voiceConnection.playStream(stream, streamOptions);

				dispatcher.once('end', reason => {
					console.log('Dispatcher ended youtube playback with reason:\t', reason);
					Music.next(guild);
				});

				dispatcher.once('start', () => {
					guild.voiceConnection.player.streamingData.pausedTime = 0;
				});

				dispatcher.on('error', err => {
					console.warn(`error playing music: ${err}`);
					guild.client.errorLog("Error playing music", err.stack ? err.stack : err, err.code);
				});
			} else if (music.queue[0].type === 4) { // from URL
				let date = Date.now();
				let rng = Math.floor(Math.random() * 10000);
				let file = `../media/temp/${rng}-${date}.${music.queue[0].id.match(/\.([^.]+)$/)[1]}`;

				const r = request(music.queue[0].id, (err) => {
					if (err) return Music.next(guild);
				}).pipe(fs.createWriteStream(file));

				r.on('finish', () => {
					const stream = fs.createReadStream(file);
					dispatcher = guild.voiceConnection.playStream(stream, streamOptions);

					dispatcher.once('end', reason => {
						fs.unlinkSync(file);
						console.log('Dispatcher ended URL playback with reason:\t', reason);
						Music.next(guild);
					});

					dispatcher.once('start', () => {
						guild.voiceConnection.player.streamingData.pausedTime = 0;
					});

					dispatcher.on('error', err => {
						console.warn(`error playing music: ${err}`);
						guild.client.errorLog("Error playing music", err.stack ? err.stack : err, err.code);
					});
				})
			} else if (music.queue[0].type === 3) { // local file
				const stream = fs.createReadStream(`../media/sounds/${music.queue[0].id}.mp3`);
				dispatcher = guild.voiceConnection.playStream(stream, streamOptions);

				dispatcher.once('end', reason => {
					console.log('Dispatcher ended sound effect playback with reason:\t', reason);
					Music.next(guild);
				});

				dispatcher.once('start', () => {
					guild.voiceConnection.player.streamingData.pausedTime = 0;
				});

				dispatcher.on('error', err => {
					console.warn(`error playing music: ${err}`);
					guild.client.errorLog("Error playing music", err.stack ? err.stack : err, err.code);
				});
			} else if (music.queue[0].type === 5) { // soundcloud
				let id = Date.now() + guild.id;
				let writeStream = soundcloud(music.queue[0].meta.id).pipe(fs.createWriteStream(`../media/temp/${id}.mp3`));

				writeStream.on('finish', () => {
					setTimeout(() => {
						let scStream = fs.createReadStream(`../media/temp/${id}.mp3`);
						if (!guild.voiceConnection) return;
						dispatcher = guild.voiceConnection.playStream(scStream, streamOptions);

						dispatcher.once('end', reason => {
							console.log('Dispatcher ended soundcloud playback with reason:\t', reason);
							fs.unlinkSync(`../media/temp/${id}.mp3`);
							Music.next(guild);
							setTimeout(() => {
								if (guild.voiceConnection && !guild.voiceConnection.dispatcher) Music.next(guild);
							}, 10000);
						});

						dispatcher.once('start', () => {
							guild.voiceConnection.player.streamingData.pausedTime = 0;
						});

						dispatcher.on('error', err => {
							console.warn(`error playing music: ${err}`);
							guild.client.errorLog("Error playing music", err.stack ? err.stack : err, err.code);
						});
					}, 100);
				});
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
				if (message.attachments.first().filesize < 25000) return reject(message._('file_too_small'));
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

					resolve ( {
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
								url: info.thumbnail_url
							},
							footer: {
								text: i18n.get('commands.nowplaying.footer', message, { tag: message.author.tag })
							}
						},
						ms: info.length_seconds * 1000
					});

					break;
				/*case 2: // uploaded file
					filename = id.match(discordRegex)[1];

					resolve({
						meta: {
							title: filename,
							queueName: `[${filename}](${id})`,
							url: id
						},
						embed: {
							title: title,
							color: 0x7289DA,
							description: `[${filename}](${id}) has been added to the queue.\n*If mp3/ogg file is fake, it will simply be skipped*`,
							footer: {
								text: `Requested by ${message.author.tag}`
							}
						}
					});

					break;*/
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
						return reject (message._('could_not_get_info'));
					});
					
					if (!meta) return reject(message._('could_not_get_info'));
					
					if (meta.duration > 7200000) return reject (message._('song_too_long'));

					let timeObj = secSpread(Math.round(meta.duration / 1000));
					let timeString = `${timeObj.h ? `${timeObj.h}${i18n.get('time.abbreviations.hours', message)} ` : ''}${timeObj.m ? `${timeObj.m}${i18n.get('time.abbreviations.minutes', message)} ` : ''}${timeObj.s}${i18n.get('time.abbreviations.seconds', message)}`;

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
							description: `[${meta.title}](${id})\n${i18n.get('commands.nowplaying.by', message)} ${meta.user.username}\n${message._('length')}: ${timeString}`,
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
			let user = reaction.users.filter(user => user.id !== client.user.id).first();
			if (!user) return;

			let fakeMessage = message;
			fakeMessage.author = user;
			fakeMessage.member = await message.guild.fetchMember(user);
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

			reaction.remove(user).catch(err => {
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
