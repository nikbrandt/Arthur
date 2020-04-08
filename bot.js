const ArthurClient = require('./struct/ArthurClient');
const { errorLog } = require('./functions/eventLoader');
const { statusUpdate } = require('./functions/eventLoader');

global.__basedir = __dirname;

let sqlQueue = new Map();
let sqlErrorQueue = new Map();
let sqlCount = 0;
global.sql = {
	get: (query, args) => {
		return sqlPromise('get', query, args);
	},
	all: (query, args) => {
		return sqlPromise('all', query, args);
	},
	run: (query, args) => {
		return sqlPromise('run', query, args);
	}
};

function sqlPromise(type, query, args) {
	return new Promise((resolve, reject) => {
		let id = sqlCount++;

		sqlQueue.set(id, resolve);
		sqlErrorQueue.set(id, reject);

		process.send({
			sql: type,
			query: query,
			args: args,
			id: id
		});
	});
}

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

client.init().catch(console.error);

process.on('message', message => {
	if (message.sql) {
		let { error, result, id } = message.sql;

		if (!error) {
			if (sqlQueue.has(id)) sqlQueue.get(id)(result);
		} else {
			if (sqlErrorQueue.has(id)) sqlErrorQueue.get(id)(error);
		}
	}
	
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