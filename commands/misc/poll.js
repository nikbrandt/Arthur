const ms = require('ms');

const pollTypeRegex = /(123|abc|yn)(?!.*(123|abc|yn))/g;

exports.run = (message, args, suffix, client, permLevel) => {
	if (!args[0]) return message.channel.send('Polls don\'t really work if they don\'t have any options. Could you like.. add some?');

	let pollType = pollTypeRegex.test(suffix) ? suffix.match(pollTypeRegex)[0] : 'abc'; // abc
	let timeInSeconds = 60;
	let options = '';

	let splitSuffixByType = suffix.split(pollType); // [ 'frog ', '|log 40s' ] OR [ 'frog ', '|', ' log 20s' ] OR [ 'frog ', '|log ', ' 20s' ] OR [ 'frog|log ', '' ] OR [ 'frog|log ', '20s' ] OR [ 'frog|log' ]
	let lastArg = splitSuffixByType[splitSuffixByType.length - 1];
	if (lastArg) {
		let time = 0;
		lastArg.split(' ').forEach(string => {
			if (!string) return;
			let parsed = ms(string);
			if (parsed) time += parsed / 1000;
			else options += string;
		});
		if (time > 0) timeInSeconds = time;
	}

	options = splitSuffixByType.slice(0, -1).join(pollType) + options;

	message.channel.send(`Here's what i have so far;\noptions: ${options}\ntime: ${timeInSeconds} seconds\npoll type: ${pollType}`);
};

exports.config = {
	enabled: true,
	permLevel: 3,
	aliases: [ 'startpoll', 'createpoll', 'newpoll' ]
};

exports.help = {
	name: 'Poll',
	description: 'Start a poll',
	usage: 'poll <option 1|option 2...> [123/abc/yn] [time] ',
	help: 'Start a poll\nSeperate options with a `|` character (below the backspace key)\nTime defaults to seconds, can be in any format with suffix (e.g. `3m 4s`)\nPoll type `123` uses number emojis, `abc` letter emojis, `yn` check and x mark emojis (yes/no)',
	category: 'Other'
};
