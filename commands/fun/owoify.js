function owoify(text) {
	text = text.replace(/[lr]/g, 'w');
	text = text.replace(/u/g, 'uw');
	text = text.replace(/[LR]/g, 'W');
	text = text.replace(/U/g, 'UW');
	return text;
}

exports.run = (message, args, suffix) => {
	if (!args[0]) return message.channel.send(message.__('no_text'));
	message.channel.send({embed: {
		description: owoify(suffix),
		color: 0x00c140
	}});
};

exports.config = {
	enabled: true,
	permLevel: 1,
	category: 'fun'
};