exports.run = (message, args, suffix, client) => {
	if (!args[0]) return message.channel.send('Mhm. I\'ll send it to no one.');
	if (!args[1] && !message.attachments.size) return message.channel.send('Right. And what, exactly, are you sending?');
	message.delete().catch(() => {});

	let messageChannel = client.channels.cache.get('304441662724243457');
	let name;

	let channel = client.users.cache.get(Object.keys(client.recentMessages)[Object.values(client.recentMessages).indexOf(args[0])]);
	if (!channel) channel = client.users.cache.get(args[0]);
	if (!channel) {
		channel = client.channels.cache.get(args[0]);
		if (!channel) return message.channel.send('That\'s not a valid ID, sorry.');
		name = `${channel.name} in ${channel.guild.name}`
	} else name = channel.tag;
	
	channel.send(suffix.slice(args[0].length + 1), { files: message.attachments.size ? message.attachments.array().map(f => f.url) : [] }).then(() => {
		if (message.channel.id === messageChannel.id) messageChannel.send({
			embed: {
				title: `Message to ${name}`,
				description: suffix.slice(args[0].length + 1),
				color: 0x00c140
			},
			files: message.attachments.size ? message.attachments.array().map(f => f.url) : []
		});
	}).catch(() => {
		if (message.channel.id === messageChannel.id) messageChannel.send({
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
	category: 'developer'
};