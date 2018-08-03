const Stopwatch = require('timer-stopwatch');
const UserObject = {};

function secSpread(sec, locale) {
	let hours = Math.floor(sec / 3600);
	let mins = Math.floor((sec - hours * 3600) / 60);
	let secs = sec - (hours * 3600 + mins * 60);
	return `${hours ? `${hours}${i18n.getString('time.abbreviations.hours', locale)} ` : ''}${mins ? `${mins}${i18n.getString('time.abbreviations.minutes', locale)} ` : ''}${secs ? `${secs}${i18n.getString('time.abbreviations.seconds', locale)}` : ''}`;
}

exports.run = (message, args, s, client, permLevel) => {
	if (args[0] && permLevel === 10) return message.channel.send(`Stopwatch object:\n${UserObject}`);

	if (!UserObject[message.author.id]) UserObject[message.author.id] = new Stopwatch();

	let on = UserObject[message.author.id].startstop();

	if (on) {
		UserObject[message.author.id].reset();
		UserObject[message.author.id].start();
		message.channel.send(message.__('stopwatch_started'));
	} else {
		message.channel.send(message.__('stopwatch_stopped', { time: secSpread(Math.ceil(UserObject[message.author.id].ms / 1000), i18n.getLocale(message)) }));
	}
};

exports.config = {
	enabled: true,
	permLevel: 1,
	aliases: []
};

exports.help = {
	name: 'Stopwatch',
	description: 'Time something with your dandy stopwatch',
	usage: 'stopwatch',
	help: 'Start or stop your stopwatch.',
	category: 'Fun'
};