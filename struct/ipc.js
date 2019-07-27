const ipc = require('node-ipc');
const sql = require('sqlite');

ipc.config.id = 'bot';
ipc.config.retry = 5000;
ipc.config.silent = true;

let ipcClient;
let validOptions;

let ipcObject = client => {
	ipc.connectTo('ipcServer', () => {
		ipcClient = ipc.of.ipcServer;
		
		ipcClient.on('connect', () => {
			console.log('Connected to IPC server.');
			ipcClient.emit('hello', { id: 'bot' });
		});
		
		ipcClient.on('get', async data => {
			const { type, id, request } = data;
			
			let output = undefined;
			let error = undefined;
			let time = undefined;
			
			switch (type) {
				case 'guild': {
					let guild = client.guilds.get(id);

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
						channels: guild.channels.map(deconstructChannel),
						iconURL: guild.iconURL,
						name: guild.name,
						id: id,
						options: options,
						userBlacklist: userBlacklist
					};

					break;
				}
				
				case 'music': {
					let guild = client.guilds.get('id');
					
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
					error = 'Stats should be sent through an interval and retrieved from the server cache.';
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
					let user = await client.fetchUser(id);
					
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
					if (!client.guilds.has(id)) {
						error = 'Could not find guild with ID provided';
						break;
					}

					time = 15;					
					output = await sql.all(`SELECT * FROM xp WHERE guildID = '${id}'`);

					break;
				}
				
				default: {
					error = 'Unrecognized type.';
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
						error = 'No params specified.';
						break;
					}
					
					let guild = client.guilds.get(id);
					
					if (!guild) {
						error = 'Invalid guild ID.';
						break;
					}
					
					switch (action) {
						case 'updateOptions': {
							if (!validOptions) validOptions = (await sql.all('PRAGMA table_info(guildOptions)')).map(opt => opt.name);
							let options = Object.keys(params);
							let vals = Object.values(params);
							
							if (options.some(option => !validOptions.includes(option))) {
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
								error = 'Sqlite error.'
							}
							
							break;
						}
						case 'blacklistUser': {
							
							
							break;
						}
						case 'unblacklistUser': {
							
							
							break;
						}
						default:
							error = 'Invalid action.';
							break;
					}
					
					break;
				}
				case 'music': {
					switch (action) {
						case 'togglePausePlay': {
							
							
							break;
						}
						case 'addToQueue': {
							
							
							break;
						}
						case 'stop': {
							
							
							break;
						}
						case 'skip': {
							
							
							break;
						}
						case 'likeToggle': {
							
							
							break;
						}
						case 'loop': {
							
							
							break;
						}
						case 'remove': {
							
							
							break;
						}
						case 'shuffle': {
							
							
							break;
						}
						case 'move': {
							
							
							break;
						}
						default:
							error = 'Invalid action.';
							break;
					}
					
					break;
				}
				case 'user': {
					switch (action) {
						case 'updateOptions': {
							
							
							break;
						}
						default:
							error = 'Invalid action.';
							break;
					}
					
					break;
				}
				default:
					error = 'Type provided does not have actions.';
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
	let { displayAvatarURL, id, username, discriminator } = user;
	
	return { displayAvatarURL, id, username, discriminator };
}

module.exports = ipcObject;