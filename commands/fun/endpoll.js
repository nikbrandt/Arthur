exports.run = async (message, args, s, client) => {
	if (!args[0]) return message.channel.send(message.__('no_args')); // You're gonna have to provide me with the message ID of the poll you'd like to end.

	if (args[0].length < 17 || args[0].length > 19 || !parseInt(args[0])) return message.channel.send(message.__('invalid_args')); // Please provide a valid message ID (Developer mode must be turned on). See @@help @@endpoll for more details.
	
	let poll = client.reactionCollectors.get(args[0]);
	if (!poll) return message.channel.send(message.__('invalid_poll')); // The ID you provided is of a poll that no longer exists or never existed in the first place. Or it's an invalid ID. Either way, rip.
	
	if (poll.message.guild.id !== message.guild.id) return message.channel.send(message.__('wrong_guild')); // You're trying to stop a poll in another server? N.. no, okay? No!
	
	await message.channel.send(message.__('finished')); // You've successfully ended the poll early. Nice.
	poll.finish();
};

exports.config = {
	enabled: true,
	permLevel: 3,
	perms: [ 'EMBED_LINKS' ],
	category: 'other'
};