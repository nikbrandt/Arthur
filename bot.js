const sqlite = require('sqlite');
const sqlite3 = require('sqlite3');

const ArthurClient = require('./struct/ArthurClient');
const { errorLog } = require('./functions/eventLoader');
const { statusUpdate } = require('../functions/eventLoader');

global.__basedir = __dirname;

const client = new ArthurClient({
	disableMentions: 'everyone',
	messageCacheMaxSize: 10,
	ws: {
		intents: [
			'GUILDS',
			'GUILD_MEMBERS',
			'GUILD_VOICE_STATES',
			'GUILD_MESSAGES',
			'GUILD_MESSAGE_REACTIONS',
			'DIRECT_MESSAGES'
		]
	}
});

sqlite.open({
	filename: '../media/db.sqlite',
	driver: sqlite3.cached.Database
}).then(db => {
	global.sql = db;
	
	client.init().catch(console.error);
}).catch(console.error);

process.on('message', message => {
	if (message.stopwatch) {
		if (client.shardQueue.has(message.stopwatch.id)) client.shardQueue.get(message.stopwatch.id)(message.stopwatch);
		client.shardQueue.delete(message.stopwatch.id);
		
		return;
	}

	if (message.stats) {
		if (client.shardQueue.has(message.id)) client.shardQueue.get(message.id)(message.value);
		client.shardQueue.delete(message.id);
		
		return;
	}
	
	if (message.uptime) {
		client.shard.uptimeStart = message.uptime;
		client.shard.id = message.id;
		errorLog.shardID = message.id;

		statusUpdate({
			title: `Shard ${message.id} started`,
			timestamp: new Date().toISOString(),
			color: 0x00c140
		});
		
		return;
	}
});