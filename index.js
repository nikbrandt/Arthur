const config = require('../media/config');

const test = !!(process.argv[2] && process.argv[2] === 'test');

const { ShardingManager } = require('discord.js');
const manager = new ShardingManager('./bot.js', {
	token: test ? config.testToken : config.token,
	shardArgs: test ? [ 'test' ] : []
});

manager.spawn().catch(console.error);

manager.on('shardCreate', shard => {
	console.log(`Launched shard ${shard.id}`);
});