const ArthurClient = require('./struct/ArthurClient');
const { errorLog } = require('./functions/eventLoader');
const { statusUpdate } = require('./functions/eventLoader');

global.__basedir = __dirname;

let sqlQueue = new Map();
let sqlErrorQueue = new Map();
let sqlCount = 0;

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

		client.shard.send({
			action: 'sql',
			type: type,
			query: query,
			args: args,
			id: id
		}).catch(err => {
			sqlQueue.delete(id);
			sqlErrorQueue.delete(id);
			reject(err);
		});
	});
}

client.init().catch(errorLog.simple);

const clientEval = (function(script) {
	return new Promise(async (resolve, reject) => {
		let res;
		
		try {
			res = await eval(script);
		} catch (e) {
			return reject(e);
		}
		
		resolve(res);
	})
}).bind(client);

process.on('message', message => {
	if (!client.shardQueue || !client.shardErrorQueue) return setTimeout(() => {
		message.retries = message.retries ? ++message.retries : 1;
		if (message.retries > 60) return;
		process.emit('message', message);
	}, 250); // retry later if client not instantiated yet
	
	switch (message.action) {
		case 'uptime': {
			client.shard.uptimeStart = message.uptime;
			client.shard.id = message.id;
			errorLog.shardID = message.id;

			statusUpdate({
				title: `Shard ${message.id} started`,
				timestamp: new Date().toISOString(),
				color: 0x00c140
			});

			break;
		}

		case 'sql': {
			let { error, result, id } = message;

			if (!error) {
				if (sqlQueue.has(id)) sqlQueue.get(id)(result);
			} else {
				if (sqlErrorQueue.has(id)) sqlErrorQueue.get(id)(error);
			}

			break;
		}

		case 'stopwatch': {
			if (client.shardQueue.has(message.id)) client.shardQueue.get(message.id)(message);
			client.shardQueue.delete(message.id);

			break;
		}

		case 'eval': {
			let { script, id } = message;

			clientEval(script).then(result => {
				client.shard.send({
					action: 'eval',
					result: result,
					id: id
				}).catch(errorLog.simple);
			}).catch(err => {
				client.shard.send({
					action: 'eval',
					error: err.toString(),
					id: id
				}).catch(errorLog.simple);
			});

			break;
		}

		case 'broadcastEval': {
			let { error, result, id } = message;

			if (error) client.shardErrorQueue.get(id)(error);
			else client.shardQueue.get(id)(result);

			client.shardQueue.delete(id);
			client.shardErrorQueue.delete(id);

			break;
		}

		case 'stats': {
			if (client.shardQueue.has(message.id)) client.shardQueue.get(message.id)(message.value);
			client.shardQueue.delete(message.id);

			break;
		}
	}
});
