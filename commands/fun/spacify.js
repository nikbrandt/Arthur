function spacify(text) {
	let array = text.split('');
	let n = text.length;
	let out = '';

	for (let i = 0; i < n - 1; i++) {
		if (array[i] === ' ') out += '   ';
		else out += array[i] + ' ';
	}

	out += array[n - 1];

	return out;
}

exports.run = (message, args, suffix) => {
	if (!args[0]) return message.channel.send(message.__('no_args'));

	let desc = '```' + spacify(suffix) + '```';
	if (desc.length > 2048) return message.channel.send(message.__('too_big'));

	message.channel.send({
		embed: {
			description: '```' + spacify(suffix) + '```',
			color: 0x00c140
		}
	});
};

exports.config = {
	enabled: true,
	permLevel: 1,
	category: 'fun'
};
