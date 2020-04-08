function secSpread(sec, locale) {
	let hours = Math.floor(sec / 3600);
	let mins = Math.floor((sec - hours * 3600) / 60);
	let secs = sec - (hours * 3600 + mins * 60);
	return `${hours ? `${hours}${i18n.getString('time.abbreviations.hours', locale)} ` : ''}${mins ? `${mins}${i18n.getString('time.abbreviations.minutes', locale)} ` : ''}${secs ? `${secs}${i18n.getString('time.abbreviations.seconds', locale)}` : ''}`;
}

exports.run = (message, args, s, client) => {
	client.shard.send({ stopwatch: message.author.id }).catch(console.error);
	client.shardQueue.set(message.author.id, object => {
		if (!object.start) message.channel.send(message.__('stopwatch_started'));
		else message.channel.send(message.__('stopwatch_stopped', { time: secSpread(Math.ceil( (Date.now() - object.start ) / 1000), i18n.getLocaleCode(message)) }));
	});
};

exports.config = {
	enabled: true,
	permLevel: 1,
	category: 'fun'
};