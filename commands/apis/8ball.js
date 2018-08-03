exports.run = (message) => {
	message.channel.send(message.__('answer'));
};

exports.config = {
	enabled: true,
	permLevel: 1,
	aliases: ['9ball', '7ball', 'ball', 'eightball']
};

exports.help = {
	name: 'Eight Ball',
	description: 'Ask the *magical eight ball* a question.',
	usage: '8ball [question]',
	help: 'Ask the *magical eight ball* a question. Not much to it.',
	category: 'APIs'
};