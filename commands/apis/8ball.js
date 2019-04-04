exports.run = (message) => {
	message.channel.send(':8ball: ' + message.__('answer'));
};

exports.config = {
	enabled: true,
	permLevel: 1,
	category: 'apis'
};