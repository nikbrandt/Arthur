exports.run = (message, args, suffix, client) => {
	if (!args[0]) return message.channel.send('Mhm. I\'ll send it to no one.');
	if (!args[1] && !message.attachments.size) return message.channel.send('Right. And what, exactly, are you sending?');

	let channel = client.channels.get('304441662724243457');
	let user = client.users.get(args[0]);
	if (!user) return message.channel.send('That\'s not a valid ID, sorry.');

	message.delete().catch();
	user.send(suffix.slice(args[0].length + 1), { files: message.attachments.size ? message.attachments.array().map(f => f.url) : [] }).then(() => {
		channel.send({
			embed: {
				title: `Message to ${user.tag}`,
				description: suffix.slice(args[0].length + 1),
				color: 0x00c140
			},
			files: message.attachments.size ? message.attachments.array().map(f => f.url) : []
		});
	}).catch(() => {
		return channel.send({embed: {
			title: `Could not send message to ${user.tag}`,
			description: 'rip.',
			color: 0xf00
		}})
	});
};

exports.config = {
	enabled: true,
	permLevel: 10,
	aliases: ['sendmessage']
};

exports.help = {
	name: 'Send Message',
	description: 'Send a message to someone by ID',
	usage: 'send <id> <message>',
	help: 'Send a message to someone through Arthur, by ID',
	category: 'Developer'
};