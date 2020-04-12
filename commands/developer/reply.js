exports.run = async (message, args, suffix, client) => {
	if (!args[0] && !message.attachments.size) return message.channel.send('yes, i\'ll send nothing. bravo.');

	let user = client.shard.id === 0 ? client.lastMessage : (await client.broadcastEval('this.lastMessage'))[0];
	if (!user) return message.channel.send('ive restarted since the last person sent a message, ffs');
	message.delete().catch(() => {});
	
	client.commands.get('send').run(message, [ user.id, suffix ], '.'.repeat(user.id.toString().length + 1) + suffix, client);
};

exports.config = {
	enabled: true,
	permLevel: 9,
	category: 'developer'
};