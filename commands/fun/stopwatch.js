const { timeString } = require('../../struct/Util.js');

exports.run = (message, args, s, client) => {
	client.shard.send({ stopwatch: message.author.id }).catch(console.error);
	client.shardQueue.set(message.author.id, object => {
		if (!object.start) message.channel.send(message.__('stopwatch_started'));
		else message.channel.send(message.__('stopwatch_stopped', { time: timeString(Math.ceil( (Date.now() - object.start ) / 1000), message) }));
	});
};

exports.config = {
	enabled: true,
	permLevel: 1,
	category: 'fun'
};