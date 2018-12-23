exports.run = (message, a, suffix) => {
	message.channel.send(suffix ? suffix + ' ( ͡° ͜ʖ ͡°)' : '( ͡° ͜ʖ ͡°)');
};

exports.config = {
	enabled: true,
	permLevel: 1
};