function reverse(text) {
	let array = text.split('');
	array.reverse();
	return array.join('');
}

exports.run = (message, args, suffix) => {
	if (!args[0]) return message.channel.send(message.__('no_args'));
	message.channel.send({embed: {
		description: reverse(suffix),
		color: 0x00c140
	}});
};

exports.config = {
	enabled: true,
	permLevel: 1
};