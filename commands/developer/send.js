exports.run = (message, args, suffix, client) => {
	if (!args[0]) return message.channel.send('Mhm. I\'ll send it to no one.');
	if (!args[1] && !message.attachments.size) return message.channel.send('Right. And what, exactly, are you sending?');
	message.delete().catch(() => {});

	let messageChannel = client.channels.get('304441662724243457');
	let channel = client.users.get(args[0]);
	if (!channel) {
		channel = client.channels.get(args[0]);
		if (!channel) return message.channel.send('That\'s not a valid ID, sorry.');
		name = `${channel.name} in ${channel.guild.name}`
	} else name = channel.tag;
	
	channel.send(suffix.slice(args[0].length + 1), { files: message.attachments.size ? message.attachments.array().map(f => f.url) : [] }).then(() => {
		messageChannel.send({
			embed: {
				title: `Message to ${name}`,
				description: suffix.slice(args[0].length + 1),
				color: 0x00c140
			},
			files: message.attachments.size ? message.attachments.array().map(f => f.url) : []
		});
	}).catch(() => {
		messageChannel.send({
			embed: {
				title: `Message to ${name} failed to send`,
				description: suffix.slice(args[0].length + 1),
				color: 0xff0000
			}
		});
	});
};

exports.config = {
	enabled: true,
	permLevel: 9,
	aliases: ['sendmessage']
};

exports.help = {
	name: 'Send Message',
	description: 'Send a message to someone by ID',
	usage: 'send <id> <message>',
	help: 'Send a message to someone through Arthur, by ID',
	category: 'Developer'
};