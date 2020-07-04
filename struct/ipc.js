const ipc = require('node-ipc');
const os = require("os");

const { shuffle } = require('../commands/music/shuffle');

ipc.config.id = 'bot';
ipc.config.retry = 5000;
ipc.config.silent = true;

let ipcClient;
let validGuildOptions;
let validUserOptions;

let ipcObject = client => {
	ipc.connectTo('ipcServer', () => {
		ipcClient = ipc.of.ipcServer;
		
		ipcClient.on('connect', () => {
			console.log('Connected to IPC server.');
			ipcClient.emit('hello', { id: 'bot' });
			
			setInterval(async () => {
				ipcClient.emit('data', {
					type: 'stats',
					data: {
						music: client.guilds.cache.filter(g => g.voice && g.voice.connection && g.music && g.music.queue).map(g => {
							return {
								id: g.id,
								name: g.name,
								icon: g.iconURL(),
								queueLength: g.music.queue.length,
								playing: g.music.playing,
								loop: !!g.music.loop,
								channelSize: g.voice.connection.channel.members.size
							}
						}),
						cpu: os.loadavg(),
						ram: process.memoryUsage().rss * 1.0e-6,
						maxRam: os.totalmem(),
						xp: client.totalXP,
						users: client.users.cache.size,
						guilds: client.guilds.cache.size,
						commandStats: {
							total: client.commandStatsObject,
							weekly: client.weeklyStatsObject[Object.keys(client.weeklyStatsObject)[Object.keys(client.weeklyStatsObject).length - 1]],
							daily: client.dailyStatsObject[Object.keys(client.dailyStatsObject)[Object.keys(client.dailyStatsObject).length - 1]]
						}
					}
				})
			}, 1000);
		});
		
		ipcClient.on('get', async data => {
			const { type, id, request } = data;
			
			let output = undefined;
			let error = undefined;
			let time = undefined;
			
			switch (type) {
				case 'guild': {
					let guild = client.guilds.cache.get(id);

					if (!guild) {
						error = 'Could not find guild with ID provided';
						break;
					}
					
					if (!guild.available) {
						error = 'Guild is not available';
						break;
					}
					
					if (guild.deleted) {
						error = 'Bot is no longer in guild';
						break;
					}
					
					await sql.run('INSERT OR IGNORE INTO guildOptions (guildID) VALUES (?)', [id]);
					let [options, userBlacklist] = await Promise.all([
						sql.get(`SELECT * FROM guildOptions WHERE guildID = '${id}'`),
						sql.all(`SELECT userBlacklist FROM guildUserBlacklist WHERE guildID = '${id}'`)
					]);

					time = 60 * 10;
					output = {
						channels: guild.channels.cache.map(deconstructChannel),
						iconURL: guild.iconURL(),
						name: guild.name,
						id: id,
						options: options,
						userBlacklist: userBlacklist
					};

					break;
				}
				
				case 'music': {
					let guild = client.guilds.cache.get('id');
					
					if (!guild) {
						error = 'Could not find guild with ID provided';
						break;
					}
					
					let music = guild.music;
					
					if (!music || music.playing === undefined) {
						error = 'Guild is not playing music';
						break;
					}

					time = -1;
					output = {
						playing: music.playing,
						textChannel: deconstructChannel(music.textChannel),
						queue: music.queue.map(obj => {
							let { type, id, meta, person } = obj;
							
							return {
								type, id,
								meta: {
									title: meta.title,
									url: meta.url
								},
								person: deconstructUser(person)
							}
						})
					};

					break;
				}
				
				case 'stats': {
					error = 'Stats should be sent through an interval and retrieved from the server cache';
					break;
				}
				
				case 'locale': {
					let locale = i18n.getLocale(id);
					
					if (!locale) {
						error = 'Locale not found';
						break;
					}
					
					time = 60 * 10;
					output = locale;
					
					break;
				}
				
				case 'commands': {
					time = 60 * 60 * 6;
					output = client.commands.map((command, commandName) => {
						let config = JSON.parse(JSON.stringify(command.config));
						config.name = commandName;
						
						return config;
					});
					
					break;
				}
				
				case 'user': {
					let user = await client.users.fetch(id);
					
					if (!user) {
						error = 'Could not find user with ID provided';
						break;
					}

					await sql.run('INSERT OR IGNORE INTO userOptions (userID) VALUES (?)', [id]);
					let [ options, xp ] = await Promise.all([
						sql.get(`SELECT * FROM userOptions WHERE userID = '${id}'`),
						sql.all(`SELECT * FROM xp WHERE userID = '${id}'`)
					]);
					
					let partialUser = deconstructUser(user);
					partialUser.options = options;
					if (xp) partialUser.xp = xp;

					output = partialUser;
					
					time = 30;
					break;
				}
				
				case 'guildXP': {
					if (!client.guilds.cache.has(id)) {
						error = 'Could not find guild with ID provided';
						break;
					}

					time = 15;					
					output = await sql.all(`SELECT * FROM xp WHERE guildID = '${id}'`);

					break;
				}
				
				default: {
					error = 'Unrecognized type';
					break;
				}
			}
			
			if (error) return ipcClient.emit('response', { request, error });
			if (!output) return ipcClient.emit('response', { request, error: 'Could not get data.' });
			
			ipcClient.emit('response', {
				request,
				data: output,
				time
			})
		});
		
		ipcClient.on('post', async data => {
			let { request, type, action, id, params } = data;
			let error;
			
			switch (type) {
				case 'guild': {
					if (!params) {
						error = 'No params specified';
						break;
					}
					
					let guild = client.guilds.cache.get(id);
					if (!guild) {
						error = 'Invalid guild ID';
						break;
					}
					
					switch (action) {
						case 'updateOptions': {
							if (!validGuildOptions) validGuildOptions = (await sql.all('PRAGMA table_info(guildOptions)')).map(opt => opt.name);
							let options = Object.keys(params);
							let vals = Object.values(params);
							
							if (options.some(option => !validGuildOptions.includes(option))) {
								error = 'Invalid option supplied';
								break;
							}
							
							let questionArray = [];
							let inputArray = [];
							
							options.forEach((option, i) => {
								questionArray.push('? = ?');
								inputArray.push(option, vals[i]);
							});
							
							try {
								await sql.run(`UPDATE guildOptions SET ${questionArray.join(', ')} WHERE guildID = ${id}`, inputArray);
							} catch (e) {
								console.error('Sqlite error while updating guildOptions in IPC module:\n', e);
								error = 'Sqlite error'
							}
							
							break;
						}
						case 'blacklistUser': {
							let user = await client.users.fetch(params.userID);
							if (!user) {
								error = 'Invalid user ID';
								break;
							}
							
							let users = await sql.all(`SELECT userID FROM guildUserBlacklist WHERE guildID = '${id}'`);
							if (!users.some(obj => obj.userID === params.userID)) await sql.run(`INSERT INTO guildUserBlacklist (guildID, userID) VALUES (?, ?)`, [ id, userID ]);
							
							break;
						}
						case 'unblacklistUser': {
							let users = await sql.all(`SELECT userID FROM guildUserBlacklist WHERE guildID = '${id}'`);
							if (!users.some(obj => obj.userID === params.userID)) {
								error = 'User is not blacklsited';
								break;
							}
							
							await sql.run(`DELETE FROM guildUserBlacklist WHERE userID = ? AND guildID = ?`, [ params.userID, id ]);
							
							break;
						}
						default:
							error = 'Invalid action';
							break;
					}
					
					break;
				}
				case 'music': {
					if (!params) {
						error = 'No params specified';
						break;
					}

					let guild = client.guilds.cache.get(id);
					if (!guild) {
						error = 'Invalid guild ID';
						break;
					}
					
					if (!params.userID) {
						error = 'No user ID specified';
						break;
					}
					
					let member;
					try {
						member = await guild.members.fetch(params.userID);
					} catch (e) {}
					if (!member) {
						error = 'Invalid user ID';
						break;
					}
					
					if (!guild.music || !guild.music.queue || !guild.voice || !guild.voice.connection) {
						error = 'No music is playing in guild';
						break;
					} // TODO: Implement the rest of the actions
					// TODO: On every music action, send a message to the music textChannel (music.textChannel) with the action performed and who performed it
					
					switch (action) {
						case 'togglePausePlay': {
							if (guild.music.playing) guild.voice.connection.dispatcher.pause(true);
							else guild.voice.connection.dispatcher.resume();
							
							guild.music.playing = !guild.music.playing;
							
							break;
						}
						case 'addToQueue': {
							if (!params.song.trim()) {
								error = 'No song provided to add';
								break;
							}
							
							let fakeMessage = {
								attachments: { size: 0 },
								author: { id: params.userID },
								member: member,
								__: (string, variables) => {
									return i18n.get('commands.play.' + string, message, variables);
								},
								guild: guild
							};
							
							let args = params.song.split(/ +/g);
							let out; // returns a 1 if successful, otherwise an error message
							
							try {
								out = await client.commands.get('play').run(fakeMessage, args, params.song, client, client.permLevel(fakeMessage), 'asdf', true);
							} catch (err) {
								error = err;
								break;
							}
							
							if (out !== 1) error = out;
							
							break;
						}
						case 'stop': {
							guild.voice.connection.disconnect();
							guild.music = {};
							
							break;
						}
						case 'skip': {
							guild.voice.connection.dispatcher.end();
							
							break;
						}
						case 'likeToggle': {
							let songID = message.guild.music.queue[0].id;
							let songType = message.guild.music.queue[0].type;
							let songMeta = message.guild.music.queue[0].meta;

							let songCheck = await sql.get(`SELECT count(1) FROM musicLikes WHERE userID = '${message.author.id}' AND id = '${songID}'`);
							
							if (songCheck['count(1)']) sql.run(`DELETE FROM musicLikes WHERE userID = '${message.author.id}' AND id = '${rows[num - 1].id}'`);
							else sql.run(`INSERT INTO musicLikes (userID, type, id, url, title, queueName) VALUES (?, ?, ?, ?, ?, ?)`, [message.author.id, songType, songID, songMeta.url, songMeta.title, songMeta.queueName]);

							break;
						}
						case 'loop': {
							guild.music.loop = !guild.music.loop;
							
							break;
						}
						case 'remove': {
							if (!params.number || params.number < 1 || params.number > guild.music.queue.length) {
								error = 'Invalid or no queue number provided';
								break;
							}
							
							if (params.number === 1) {
								error = 'Use skip instead of remove for current song';
								break;
							}
							
							guild.music.queue.splice(num - 1, 1);
							
							break;
						}
						case 'shuffle': {
							if (guild.music.queue.length < 3) {
								error = 'Queue too short to shuffle';
								break;
							}

							let queue = guild.music.queue;
							let first = queue.shift();
							let shuffled = shuffle(queue);
							shuffled.unshift(first);
							
							guild.music.queue = shuffled;
							
							break;
						}
						case 'move': {
							if (!params.number || !params.position) {
								error = 'Number or position not provided';
								break;
							}
							
							if (params.number < 1 || params.number > guild.music.queue.length || params.position < 1 || params.position > guild.music.queue.length) {
								error = 'Number or position out of possible range';
								break;
							}
							
							if (params.number === params.position) break;
							
							let item = guild.music.queue.splice(params.number - 1, 1);
							guild.music.queue.splice(params.position - 1, 0, item[0]);
							
							break;
						}
						default:
							error = 'Invalid action';
							break;
					}
					
					break;
				}
				case 'user': {
					switch (action) {
						case 'updateOptions': {
							if (!validUserOptions) validUserOptions = (await sql.all('PRAGMA table_info(guildOptions)')).map(opt => opt.name);
							let options = Object.keys(params);
							let vals = Object.values(params);

							if (options.some(option => !validUserOptions.includes(option))) {
								error = 'Invalid option supplied';
								break;
							}

							let questionArray = [];
							let inputArray = [];

							options.forEach((option, i) => {
								questionArray.push('? = ?');
								inputArray.push(option, vals[i]);
							});

							try {
								await sql.run(`UPDATE userOptions SET ${questionArray.join(', ')} WHERE guildID = ${id}`, inputArray);
							} catch (e) {
								client.errorLog('Sqlite error while updating guildOptions in IPC module', e);
								error = 'Sqlite error'
							}

							break;
						}
						default:
							error = 'Invalid action';
							break;
					}
					
					break;
				}
				default:
					error = 'Type provided does not have actions';
					break;
			}
			
			let out = { request };
			if (error) out.error = error;
			
			ipcClient.emit('postResponse', out);
		});
	});
};

function deconstructChannel(channel) {
	let { id, name, type, parent, parentID } = channel;
	
	let out = { id, name, type };

	if (parent) out.parent = {
		name: parent.name,
		id: parentID,
		type: 'category'
	};

	return out;
}

function deconstructUser(user) {
	let { id, username, discriminator } = user;
	let displayAvatarURL = user.displayAvatarURL();
	
	return { displayAvatarURL, id, username, discriminator };
}

module.exports = ipcObject;