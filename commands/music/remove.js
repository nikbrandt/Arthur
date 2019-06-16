exports.run = (message, args, suffix, client, permLevel) => {
	if (!message.guild.music || !message.guild.music.queue) return message.channel.send(message.__('nothing_playing'));

	if (!args[0]) return message.channel.send(message.__('no_args'));
	let num = parseInt(args[0]);
	if (!num) return message.channel.send(message.__('not_a_number'));
	if (num < 1) return message.channel.send(message.__('negative_number'));
	if (num === 1) return message.channel.send(message.__('current_song'));
	if (num > message.guild.music.queue.length) return message.channel.send(message.__('does_not_exist_yet'));

	if (!message.member.roles.find(r => r.name.toLowerCase() === 'dj') && !message.member.roles.find(r => r.name.toLowerCase() === 'music') && permLevel < 3 && message.guild.music.queue[num - 1].person.id !== message.author.id) return;

	message.guild.music.queue.splice(num - 1, 1);
	message.channel.send(message.__('success', { num, name: message.member.displayName.replace(/@/g, '@\u200b').replace(/ /g, '') }));
};

exports.config = {
	enabled: true,
	permLevel: 2,
	category: 'music'
};