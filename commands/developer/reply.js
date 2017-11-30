exports.run = (message, args, suffix, client, permLevel) => {
	if (!args[0] && !message.attachments.size) return message.channel.send('yes, i\'ll send nothing. bravo.');

	let channel = client.channels.get('304441662724243457');
	let user = client.lastMessage;
	if (!user) return message.channel.send('nobody has sent a message to me.. are you drunk?');
	message.delete().catch();

	user.send(suffix, { files: message.attachments.size ? message.attachments.array().map(f => f.url) : [] }).then(() => {
		channel.send({
			embed: {
				title: `Message to ${user.tag}`,
				description: suffix,
				color: 0x00c140
			},
			files: message.attachments.size ? message.attachments.array().map(f => f.url) : []
		});
	}).catch(() => {
		channel.send({
			embed: {
				title: `Message to ${user.tag} failed to send`,
				description: suffix.slice(args[0].length + 1),
				color: 0xff0000
			}
		});
	});
};

exports.config = {
	enabled: true,
	permLevel: 9,
	aliases: []
};

exports.help = {
	name: 'Reply',
	description: 'Reply to the previous message sent to the bot',
	usage: 'reply <message>',
	help: 'Reply to the previous message sent to the bot.',
	category: 'Developer'
};