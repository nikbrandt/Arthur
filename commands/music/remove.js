exports.run = (message, args, suffix, client, permLevel) => {
	if (!message.guild.music || !message.guild.music.queue) return message.channel.send('There is no music playing.');

	if (!args[0]) return message.channel.send('Ya\'ll needs to specify which song to remove (gimme a number)');
	let num = parseInt(args[0]);
	if (!num) return message.channel.send('Hey.. that\'s not a number.. (or you chose zero and that\'s also not a song number dumbo)');
	if (num < 1) return message.channel.send('there is no negative queue tho');
	if (num === 1) return message.channel.send('hey use skip don\'t remove the current song that borks things..');
	if (num > message.guild.music.queue + 1) return message.channel.send('C\'mon, there aren\'t that many songs in the queue.. yet.');

	if (!message.member.roles.find(r => r.name.toLowerCase() === 'dj') && !message.member.roles.find(r => r.name.toLowerCase() === 'music') && permLevel < 3 && message.guild.music.queue[num - 1].person.id !== message.author.id) return;

	message.guild.music.queue.splice(num - 1, 1);
	message.channel.send(`Success! Song #${num} has been removed from the queue. *someone might have wanted to hear that music*`);
};

exports.config = {
	enabled: true,
	permLevel: 2,
	aliases: [ 'removesong' ]
};

exports.help = {
	name: 'Remove',
	description: 'Remove a song from the queue',
	usage: 'remove <song #>',
	help: 'Remove a song from the queue by it\'s number. You need "DJ", "Music", Mod+, or to have added the song yourself to be able remove it.',
	category: 'Music'
};