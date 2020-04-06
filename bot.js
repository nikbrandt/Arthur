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
		if (client.stopwatchQueue.has(message.stopwatch.id)) client.stopwatchQueue.get(message.stopwatch.id)(message.stopwatch);
		
		return;
	}
});