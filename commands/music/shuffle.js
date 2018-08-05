function shuffle(array) { // Fisher-Yates shuffle, https://bost.ocks.org/mike/shuffle/
	let m = array.length, t, i;
	while (m) {
		i = Math.floor(Math.random() * m--);
		t = array[m];
		array[m] = array[i];
		array[i] = t;
	}
	return array;
}

exports.run = (message, args, suffix, client, permLevel) => {
	if (!message.member.roles.find(r => r.name.toLowerCase() === 'dj') && !message.member.roles.find(r => r.name.toLowerCase() === 'music') && permLevel < 3) return;
	if (!message.guild.music || !message.guild.music.queue) return message.channel.send('You want to shuffle the queue, but there is no queue! Queue some music with the `play` command.');
	if (message.guild.music.queue.length < 3) return message.channel.send('There\'s no point in shuffling a one or two song queue - it won\'t change the order at all.');

	let queue = message.guild.music.queue;
	let first = queue[0];
	let shuffled = shuffle(queue.slice(1));
	shuffled.unshift(first);

	message.guild.music.queue = shuffled;
	message.channel.send('Music queue shuffled.');
};

exports.config = {
	enabled: true,
	permLevel: 2,
	aliases: []
};

exports.help = {
	name: 'Shuffle',
	description: 'Shuffle the current music queue',
	usage: 'shuffle',
	help: 'Shuffle the current music queue - cannot be undone.',
	category: 'Music'
};