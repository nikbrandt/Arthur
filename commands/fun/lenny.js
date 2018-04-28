exports.run = (message, a, suffix) => {
	message.channel.send(suffix ? suffix : '' + '( ͡° ͜ʖ ͡°)');
};

exports.config = {
	enabled: true,
	permLevel: 1,
	aliases: []
};

exports.help = {
	name: 'Lenny',
	description: '( ͡° ͜ʖ ͡°)',
	usage: 'lenny',
	help: '( ͡° ͜ʖ ͡°) ( ͡° ͜ʖ ͡°)',
	category: 'Fun'
};