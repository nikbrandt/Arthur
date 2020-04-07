const sqlite = require('sqlite');
const sqlite3 = require('sqlite3');
const ArthurClient = require('./struct/ArthurClient');

global.__basedir = __dirname;

const client = new ArthurClient({
	fetchAllMembers: false,
	disabledEvents: ['TYPING_START'],
	disableEveryone: true,
	messageCacheMaxSize: 10
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
		
		return;
	}
});