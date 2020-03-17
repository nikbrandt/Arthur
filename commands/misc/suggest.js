const config = require('../../../media/config.json');
const Trello = require('trello');
const trello = new Trello(config.trello.key, config.trello.token);

exports.run = (message, args, suffix, client) => {
	if (!args[0]) return message.channel.send(message.__('no_args'));
	let channel = client.channels.cache.get(config.trello.channel);

	let splitified = suffix.split('\n');
	if (splitified[0].length > 256) {
		let extra = '...' + splitified[0].substring(253) + '\n\n---';
		splitified[0] = splitified[0].substring(0, 253) + '...';
		splitified.splice(1, 0, extra);
	}

	let attachments = message.attachments.map(a => `[${a.filename}](${a.url})`);

	let footer = attachments.length
		? `Attached:\n${attachments.join('\n')}\n\n*Suggested by ${message.author.tag} (${message.author.id})*`
		: `*Suggested by ${message.author.tag} (${message.author.id})*`;

	trello.addCard(splitified[0],
		splitified[1]
		? splitified.slice(1).join('\n') + `\n\n${footer}`
		: footer,
		config.trello.board
	).then(card => {
		channel.send({
			embed: {
				title: splitified[0],
				url: card.url,
				description: splitified[1] ? splitified.slice(1).join('\n') : undefined,
				footer: {
					text: `Suggested by ${message.author.tag}`,
					icon_url: message.author.displayAvatarURL()
				},
				color: 0x00c140
			},
			files: message.attachments.map(a => {return { attachment: a.url, name: a.filename }})
		});

		message.channel.send(message.__('success', { extra: message.guild && message.guild.id === '304428345917964290' ? '' : '\n' + message.__('check_support_server', { link: client.config.info.guildLink }) }));
	}).catch(err => {
		message.channel.send(message.__('error', { link: client.config.info.guildLink, err }));
	});
};

exports.config = {
	enabled: true,
	permLevel: 1,
	category: 'other'
};