const config = require('../../../media/config.json');
const Trello = require('trello');
const trello = new Trello(config.trello.key, config.trello.token);

exports.run = (message, args, suffix, client) => {
	if (!args[0]) return message.channel.send(message.__('no_args'));
	let splitified = suffix.split('\n');
	let channel = client.channels.get(config.trello.channel);

	let attachments = message.attachments.array().map(a => a ? a.url : '');

	let footer = attachments.length
		? `Attached:\n${attachments.map(a => `[${a.filename}](${a.url})`).join('\n')}\n\n*Suggested by ${message.author.tag} (${message.author.id})*`
		: `*Suggested by ${message.author.tag} (${message.author.id})*`;

	trello.addCard(splitified[0],
		splitified[1]
		? splitified.slice(1).join('\n') + `\n\n${footer}`
		: footer,
		config.trello.board
	).then(card => {
		channel.send({
			embed: {
				author: {
					name: splitified[0],
					url: card.url
				},
				description: splitified[1] ? splitified.slice(1).join('\n') : undefined,
				footer: {
					text: `Suggested by ${message.author.tag}`,
					icon_url: message.author.displayAvatarURL
				},
				color: 0x00c140
			},
			files: attachments
		});

		message.channel.send(message.__('success', { extra: message.guild && message.guild.name === 'Arthur Official Discord' ? '' : '\n' + message.__('check_support_server', { link: client.config.info.guildLink }) }));
	}).catch(err => {
		message.channel.send(message.__('error', { link: client.config.info.guildLink, err }));
	});
};

exports.config = {
	enabled: true,
	permLevel: 1,
	aliases: ['suggestion', 'iwant']
};

exports.help = {
	name: 'Suggest',
	description: 'Suggest a command or feature to be added to Arthur.',
	usage: 'suggest <suggestion>',
	help: 'Suggest something to be added to Arthur, preferably in English.',
	category: 'Other'
};
