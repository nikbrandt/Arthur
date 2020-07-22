const { timeString } = require('../../struct/Util.js');

exports.run = (message, args, s, client) => {
	client.shard.send({ action: 'stopwatch', id: message.author.id }).catch(client.errorLog.simple);
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