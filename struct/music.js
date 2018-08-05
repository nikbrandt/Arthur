const fs = require('fs');
const sql = require('sqlite');
const ytdl = require('ytdl-core');
const request = require('request');
const isThatAnMp3 = require('is-mp3');
const orPerhapsOgg = require('is-ogg');
const readChunk = require('read-chunk');
const search = require('youtube-search');
const soundcloud = require('./soundcloud');

const YTRegex = /^(https?:\/\/)?(www\.|m\.|music\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/v\/|youtube\.com\/embed\/)([A-z0-9_-]{11})(&.*)?$/;
const soundcloudRegex = /^(https:\/\/)?soundcloud.com\/.+\/[^/]+$/;
const songRegex = /^https?:\/\/.+\/([^/]+)\.(mp3|ogg)$/;
const reactionFilter = reaction => ['👍', '⏩', '⏹', '🔁', '🎶'].includes(reaction.emoji.name);

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

const Music = {
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

		setTimeout(() => {
			let dispatcher;

			if (!guild.voiceConnection) {
				guild.music = {};
				return;
			}

			if (notify === 'true' && music.queue[0].embed && !first) {
				let embed = music.queue[0].embed;
				embed.author.name = 'Now Playing';
				music.textChannel.send({ embed }).then(msg => {
					Music.addReactionCollector(msg, msg.client, music.queue[0].ms);
				});
			}

			if (music.queue[0].type === 1) { // youtube
				const stream = ytdl(music.queue[0].id, { quality: 'highestaudio' });
				dispatcher = guild.voiceConnection.playStream(stream, { volume: 0.3, passes: 2, bitrate: 'auto' });

				dispatcher.once('end', () => {
					Music.next(guild);
				});

				dispatcher.once('start', () => {
					guild.voiceConnection.player.streamingData.pausedTime = 0;
				});
			} else if (music.queue[0].type === 4) { // from URL
				let date = Date.now();
				let rng = Math.floor(Math.random() * 10000);
				let file = `../media/temp/${rng}-${date}.${music.queue[0].id.match(/\.([^.]+)$/)[1]}`;

				const r = request(music.queue[0].id, (err) => {
					if (err) return Music.next(guild);
				}).pipe(fs.createWriteStream(file));

				r.on('finish', () => {
					let buffer = readChunk.sync(file, 0, 4);
					if (!isThatAnMp3(buffer) && !orPerhapsOgg(buffer)) {
						Music.next(guild);
						fs.unlinkSync(file);
						return;
					}

					const stream = fs.createReadStream(file);
					dispatcher = guild.voiceConnection.playStream(stream, { volume: 0.3, passes: 2, bitrate: 'auto' });

					dispatcher.once('end', () => {
						fs.unlinkSync(file);
						Music.next(guild);
					});

					dispatcher.once('start', () => {
						guild.voiceConnection.player.streamingData.pausedTime = 0;
					});
				})
			} else if (music.queue[0].type === 3) { // local file
				const stream = fs.createReadStream(`../media/sounds/${music.queue[0].id}.mp3`);
				dispatcher = guild.voiceConnection.playStream(stream, { volume: 0.3, passes: 2, bitrate: 'auto' });

				dispatcher.once('end', () => {
					Music.next(guild);
				});

				dispatcher.once('start', () => {
					guild.voiceConnection.player.streamingData.pausedTime = 0;
				});
			} else if (music.queue[0].type === 5) { // soundcloud
				let id = Date.now() + guild.id;
				let writeStream = soundcloud(music.queue[0].meta.id).pipe(fs.createWriteStream(`../media/temp/${id}.mp3`));

				writeStream.on('finish', () => {
					setTimeout(() => {
						let scStream = fs.createReadStream(`../media/temp/${id}.mp3`);
						if (!guild.voiceConnection) return;
						dispatcher = guild.voiceConnection.playStream(scStream, { volume: 0.3, passes: 2, bitrate: 'auto' });

						dispatcher.once('end', () => {
							fs.unlinkSync(`../media/temp/${id}.mp3`);
							Music.next(guild);
							setTimeout(() => {
								if (guild.voiceConnection && !guild.voiceConnection.dispatcher) Music.next(guild);
							}, 10000);
						});

						dispatcher.once('start', () => {
							guild.voiceConnection.player.streamingData.pausedTime = 0;
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

			if (message.attachments.size) {
				type = 4;
				id = message.attachments.first().url;

				if (!id.endsWith('.mp3') && !id.endsWith('.ogg')) return reject('I only support playback of mp3\'s and oggs for now. Go ahead and type `a.suggest music in <file type> format pls` if you need another audio file type supported.');
				if (message.attachments.first().filesize < 25000) return reject('Your file isn\'t powerful enough! I need one bigger than 25 KB, thanks.');

				resolve( {
					id: id,
					type: type
				} );
			} else if (args[0] === 'liked' || args[0] === 'likes') {
				let array = await sql.all(`SELECT type, id FROM musicLikes WHERE userID = '${message.author.id}'`);
				if (!array || !array.length) return reject('If you haven\'t liked a song yet, it\'s quite challenging for me to play a liked song.');
				let num;

				if (args[1] === 'random') num = Math.ceil(Math.random() * array.length);
				else {
					if (!args[1]) return reject('Yes, I\'ll just pick the song you want. Y\'know, because I have telepathic powers. (tell me which song to play)');
					num = parseInt(args[1]);
					if (!num) return reject('Hey.. that\'s not a number.. (or you chose zero, which really isn\'t a song number so yeah)');
					if (num < 1) return reject('there is no negative song tho <:crazyeyes:359106555314044939>');
					if (num > array.length) return reject('I\'m sorry, but you just haven\'t liked that many songs yet.');
				}

				if (!array[num - 1]) return reject('Not sure why, but I simply couldn\'t find that song. Huh.');

				type = array[num - 1].type;
				id = array[num - 1].id;

				resolve( {
					id: id,
					type: type
				} );
			} else if (args[0] === 'top') {
				let array = await Music.likedArray();
				let num;

				if (args[1] === 'random') num = Math.ceil(Math.random() * array.length);
				else {
					if (!args[1]) return reject('Yes, I\'ll just pick the song you want. Y\'know, because I have telepathic powers. (tell me which song to play)');
					num = parseInt(args[1]);
					if (!num) return reject('Hey.. that\'s not a number.. (or you chose zero, which really isn\'t a song number so yeah)');
					if (num < 1) return reject('there is no negative song tho <:crazyeyes:359106555314044939>');
					if (num > array.length) return reject('I\'m sorry, but there just aren\'t that many liked songs yet.');
				}

				let obj = array[num - 1];
				if (!obj) return reject('I couldn\'t find that song for some reason, I\'m sorry.');
				type = obj.type;
				id = obj.id;

				resolve( {
					id: id,
					type: type
				} );
			} else if (args[0] === 'file') {
				type = 3;
				let files = fs.readdirSync('../media/sounds');
				files = files.map(f => f.replace(/\.mp3/g, ''));

				if (!args[1]) return reject(`Hey man, you have to tell me what file to play.. The current options are: ${files.map(f => '`' + f + '`').join(', ')}`);
				if (!files.includes(args[1])) return reject(`Darn! That file doesn't exist. You can suggest to add it by DMing Gymnophoria#8146. The files you *can* play are as follows: ${files.map(f => '`' + f + '`').join(', ')}`);

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
			} else if (args[0].endsWith('.mp3') || args[0].endsWith('.ogg')) {
				if (!songRegex.test(args[0])) return reject('Please provide a valid URL. (mp3/ogg only supported, suggest more formats if needed)');

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
					
					if (!result) return reject('No results found. Silly goose.');

					resolve ( {
						id: result.permalink_url,
						type: 5
					} );
				}

				search(suffix, youtubeSearch, (err, results) => {
					if (err || !results || !results[0]) {
						return soundcloud.search(suffix).then(result => {
							if (!result) return reject('The song you searched for does not exist on YouTube or SoundCloud.. rip');
							
							resolve ( {
								id: result.permalink_url,
								type: 5
							});
						}).catch(() => {
							reject('The song you searched for does not exist on YouTube or SoundCloud.. rip');
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

			switch (type) {
				case 1: // youtube
					let info = await ytdl.getInfo(id).catch(err => {
						return reject('There seems to have been an error retrieving info for that video - \n' + err.stack.split('\n')[0]);
					});
					if (!info) return reject('I couldn\'t gather information on this video - this might be because it is not available in the US, sorry!');
					if (info.livestream === '1' || info.live_playback === '1' || info.length_seconds > 7200 ) return reject(info.length_seconds > 7200 ? 'Hey there my dude that\'s a bit much, I don\'t wanna play a song longer than 2 hours for ya.' : 'Trying to play a livestream, eh? I can\'t do that, sorry.. ;-;');

					let secObj = secSpread(info.length_seconds);
					resolve({
						meta: {
							url: `https://youtu.be/${id}`,
							title: `${info.title} (${secObj.h ? `${secObj.h}h ` : ''}${secObj.m ? `${secObj.m}m ` : ''}${secObj.s}s)`,
							queueName: `[${info.title}](https://youtu.be/${id}) - ${secObj.h ? `${secObj.h}h ` : ''}${secObj.m ? `${secObj.m}m ` : ''}${secObj.s}s`
						},
						embed: {
							author: {
								name: title,
								icon_url: info.author.avatar
							},
							color: 0xff0000,
							description: `[${info.title}](https://youtu.be/${id})\nBy [${info.author.name}](${info.author.channel_url})\nLength: ${secObj.h ? `${secObj.h}h ` : ''}${secObj.m ? `${secObj.m}m ` : ''}${secObj.s}s`,
							thumbnail: {
								url: info.thumbnail_url
							},
							footer: {
								text: `Requested by ${message.author.tag}`
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
							title: `Sound effect - ${id}`,
							queueName: `Sound effect - ${id}`,
							url: 'https://github.com/Gymnophoria/Arthur'
						},
						ms: 30000
					});

					break;
				case 4: // custom file
					let filename = id.match(songRegex)[1];
					if (!filename) return reject('Could not parse URL, please provide a valid \'un.');

					resolve({
						meta: {
							title: filename,
							queueName: `[${filename}](${id})`,
							url: id
						},
						embed: {
							title: title,
							color: 0x7289DA,
							description: `[${filename}](${id})`,
							footer: {
								text: `Added by ${message.author.tag} | Invalid URLs will be skipped`
							}
						},
						ms: 180000
					});

					break;
				case 5: // soundcloud
					let meta = await soundcloud.getInfo(id).catch(err => {
						return reject (`I couldn't retrieve info for that song - ${err.stack ? err.stack.split('\n')[0] : err}`);
					});
					
					if (!meta) return reject('I couldn\'t get info for the song. Odd. Try again? I dunno.');
					
					if (meta.duration > 7200000) return reject ('I\'d rather not play a song longer than two hours long, sorry.');

					let timeObj = secSpread(Math.round(meta.duration / 1000));

					resolve ({
						meta: {
							url: id,
							title: `${meta.title} (${timeObj.h ? `${timeObj.h}h ` : ''}${timeObj.m ? `${timeObj.m}m ` : ''}${timeObj.s}s)`,
							queueName: `[${meta.title}](${id}) - ${timeObj.h ? `${timeObj.h}h ` : ''}${timeObj.m ? `${timeObj.m}m ` : ''}${timeObj.s}s`,
							id: meta.id
						},
						embed: {
							author: {
								name: title,
								icon_url: meta.user.avatar_url
							},
							color: 0xff8800,
							description: `[${meta.title}](${id})\nBy ${meta.user.username}\nLength: ${timeObj.h ? `${timeObj.h}h ` : ''}${timeObj.m ? `${timeObj.m}m ` : ''}${timeObj.s}s`,
							thumbnail: {
								url: meta.artwork_url
							},
							footer: {
								text: `Requested by ${message.author.tag}`
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

		try {
			await message.react('👍');
			await message.react('⏩');
			await message.react('⏹');
			await message.react('🔁');
			await message.react('🎶');
		} catch (e) {
			return;
		}

		collector.on('collect', async reaction => {
			let user = reaction.users.filter(user => user.id !== client.user.id).first();
			if (!user) return;

			// .then(() => {console.log('removed reaction')}).catch(e => console.error);
			// console.log(user);

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
	}
};

module.exports = Music;
