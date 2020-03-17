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
	if (!message.member.roles.cache.find(r => r.name.toLowerCase() === i18n.get('struct.music.dj', message).toLowerCase()) && !message.member.roles.find(r => r.name.toLowerCase() === i18n.get('struct.music.music', message).toLowerCase()) && permLevel < 3) return message.react(':missingpermissions:407054344874229760').catch(() => {});
	if (!message.guild.music || !message.guild.music.queue) return message.channel.send(message.__('no_queue'));
	if (message.guild.music.queue.length < 3) return message.channel.send(message.__('too_small')); // Kappa

	let queue = message.guild.music.queue;
	let first = queue[0];
	let shuffled = shuffle(queue.slice(1));
	shuffled.unshift(first);

	message.guild.music.queue = shuffled;
	message.channel.send(message.__('shuffled'));
};

exports.config = {
	enabled: true,
	permLevel: 2,
	category: 'music'
};