exports.run = (message, args, suffix, client, permLevel) => {
	if (!args[0] && !message.attachments.size) return message.channel.send('yes, i\'ll send nothing. bravo.');

	let channel = client.channels.cache.get('304441662724243457');
	let user = client.lastMessage;
	if (!user) return message.channel.send('ive restarted since the last person sent a message, ffs');
	message.delete().catch(() => {});
  
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
	category: 'developer'
};