function reverse(text) {
	let array = text.split('');
	array.reverse();
	return array.join('');
}

exports.run = (message, args, suffix) => {
	if (!args[0]) return message.channel.send('You\'ve gotta provide me with something to reverse, lul');
	message.channel.send({embed: {
		description: reverse(suffix),
		color: 0x00c140
	}});
};

exports.config = {
	enabled: true,
	permLevel: 2,
	aliases: ['flip']
};

exports.help = {
	name: 'Reverse',
	description: 'Reverse some text',
	usage: 'reverse <text>',
	help: 'Reverse some text. Might be entertaining, likely won\'t be.',
	category: 'Fun'
};