const ipc = require('node-ipc');
const sql = require('sqlite');

const Queue = require('../../ipc/structures/Queue');

ipc.config.id = 'bot';
ipc.config.retry = 1500;
//ipc.config.silent = true;

let queue = new Queue();
let ipcClient;

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
			let time = undefined;
			let error;
			
			switch (type) {
				case 'guild':
					let guild = client.guilds.get(id);
					
					if (!guild) error = 'Could not find guild with ID provided';
					else if (!guild.available) error = 'Guild is not available';
					else if (guild.deleted) error = 'Bot is no longer in guild';
					else {
						await sql.run('INSERT OR IGNORE INTO guildOptions (guildID) VALUES (?)', [ id ]);
						let [ options, userBlacklist ] = await Promise.all([
							sql.get(`SELECT * FROM guildOptions WHERE guildID = '${id}'`),
							sql.all(`SELECT * FROM guildUserBlacklist WHERE guildID = '${id}'`)
						]);
						
						output = {
							channels: guild.channels.map(channel => {
								return {
									id: channel.id,
									name: channel.name,
									parent: channel.parent
										? { name: channel.parent.name, id: channel.parentID }
										: undefined,
									type: channel.type
								}
							}),
							icon: guild.iconURL,
							name: guild.name,
							id: id,
							options: options,
							userBlacklist: userBlacklist
						};
					}
					
					break;
				case 'music':
					
					break;
				case 'stats':
					error = 'Stats should be sent through an interval and retrieved by the server cache.';
					break;
				case 'locale':
					
					break;
				case 'commands':
					
					break;
				case 'userInfo':
					
					break;
				case 'guildXP':
					
					break;
				default:
					error = 'Unrecognized type.';
					break;
			}
			
			if (error) return ipcClient.emit('response', { request, error });
			if (!output) return ipcClient.emit('response', { request, error: 'Could not get data.' });
			
			ipcClient.emit('response', {
				request,
				data: output,
				time
			})
		});
	});
};



module.exports = ipcObject;