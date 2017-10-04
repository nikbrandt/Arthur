const config = require('../../../media/config.json');
const Trello = require('trello');
const trello = new Trello(config.trello.key, config.trello.token);

exports.run = (message, args, suffix, client) => {
	if (!args[0]) return message.channel.send('So you want to suggest nothing? Nothing at all? Really? No.');
	let splitified = suffix.split('\n');
	let channel = client.channels.get('304429067892031490');

	channel.send({embed: {
		author: {
			name: `New suggestion by ${message.author.tag}`,
			icon_url: message.author.displayAvatarURL
		},
		description: suffix,
		color: 0x00c140
	}});

	trello.addCard(splitified[0],
		splitified[1]
		? splitified.slice(1).join('\n') + `\n\n*Suggested by ${message.author.tag} (${message.author.id})*`
		: `*Suggested by ${message.author.tag} (${message.author.id})*`,
		config.trello.board
	).then(() => {
		message.channel.send('Thanks, your suggestion might be added someday :thumbsup:');
	}).catch(err => {
		message.channel.send(`I couldn't add the card for some reason.. Heck man that's weird, could you report it to Gymnophoria#8146?\n${err}`)
	})
};

exports.config = {
	enabled: true,
	permLevel: 2,
	aliases: ['suggestion', 'iwant']
};

exports.help = {
	name: 'Suggest',
	description: 'Suggest a command or feature to be added to Arthur.',
	usage: 'suggest <suggestion>',
	help: 'Suggest something to be added to Arthur.',
	category: 'Other'
};