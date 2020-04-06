const config = require('../media/config');

const test = !!(process.argv[2] && process.argv[2] === 'test');

const { ShardingManager } = require('discord.js');
const manager = new ShardingManager('./bot.js', {
	token: test ? config.testToken : config.token,
	shardArgs: test ? [ 'test' ] : []
});

manager.spawn().catch(console.error);

let stopwatchUserObject = {};

manager.on('shardCreate', shard => {
	console.log(`Launched shard ${shard.id}`);
	
	shard.on('ready', () => {
		shard.send({
			uptime: Date.now() - Math.floor(process.uptime() * 1000),
			id: shard.id
		}).catch(console.error);
	});
	
	
	shard.on('message', message => {
		if (message.stopwatch) {
			let id = message.stopwatch;
			
			if (stopwatchUserObject[id]) {
				shard.send({ stopwatch: { id: id, start: stopwatchUserObject[id] }}).catch(() => {});
				delete stopwatchUserObject[id];
			} else {
				stopwatchUserObject[id] = Date.now();
				shard.send({ stopwatch: { id: id }}).catch(() => {});
			}
			
			return;
		}
	});
});