const Stopwatch = require('timer-stopwatch');
const UserObject = {};

function secSpread(sec) {
	let hours = Math.floor(sec / 3600);
	let mins = Math.floor((sec - hours * 3600) / 60);
	let secs = sec - (hours * 3600 + mins * 60);
	return `${hours ? `${hours}h ` : ''}${mins ? `${mins}m ` : ''}${secs ? `${secs}s` : ''}`;
}

exports.run = (message, args, s, client, permLevel) => {
	if (args[0] && permLevel === 10) return message.channel.send(`Stopwatch object:\n${UserObject}`);

	if (!UserObject[message.author.id]) UserObject[message.author.id] = new Stopwatch();

	let on = UserObject[message.author.id].startstop();

	if (on) {
		UserObject[message.author.id].reset();
		UserObject[message.author.id].start();
		message.channel.send('Stopwatch started.');
	} else {
		message.channel.send(`Stopwatch stopped. ${secSpread(Math.ceil(UserObject[message.author.id].ms / 1000))}.`);
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