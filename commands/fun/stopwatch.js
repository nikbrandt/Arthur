const UserObject = {};

function secSpread(sec, locale) {
	let hours = Math.floor(sec / 3600);
	let mins = Math.floor((sec - hours * 3600) / 60);
	let secs = sec - (hours * 3600 + mins * 60);
	return `${hours ? `${hours}${i18n.getString('time.abbreviations.hours', locale)} ` : ''}${mins ? `${mins}${i18n.getString('time.abbreviations.minutes', locale)} ` : ''}${secs ? `${secs}${i18n.getString('time.abbreviations.seconds', locale)}` : ''}`;
}

exports.run = (message, args, s, client, permLevel) => {
	if (args[0] && permLevel === 10) return message.channel.send(`Stopwatch object:\n${UserObject}`);

	if (!UserObject[message.author.id]) {
		UserObject[message.author.id] = Date.now();
		message.channel.send(message.__('stopwatch_started'));
	} else {
		message.channel.send(message.__('stopwatch_stopped', { time: secSpread(Math.ceil( (Date.now() - UserObject[message.author.id] ) / 1000), i18n.getLocaleCode(message)) }));
		UserObject[message.author.id] = null;
	}
};

exports.config = {
	enabled: true,
	permLevel: 1,
	category: 'fun'
};