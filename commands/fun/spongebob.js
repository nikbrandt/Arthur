function alternateCaps(text) {
	let array = text.split('');
	let n = text.length;
	let out = '';
	let caps = false;

	for (let i = 0; i < n; i++) {
		if (!/[A-Za-z]/.test(array[i])) {
			out += array[i];
			continue;
		}

		if (caps) out += array[i].toUpperCase();
		else out += array[i].toLowerCase();

		caps = !caps;
	}

	return out;
}

exports.run = (message, args, suffix) => {
	if (!args[0]) return message.channel.send(message.__('no_args'));

	message.channel.send({
		embed: {
			description: alternateCaps(suffix),
			color: 0x00c140
		}
	});
};

exports.config = {
	enabled: true,
	permLevel: 1,
	category: 'fun'
};
