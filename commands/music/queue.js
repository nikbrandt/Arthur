const ytdl = require('ytdl-core');

exports.run = async (message, args) => {
	if (!message.guild.music || !message.guild.music.queue) return message.channel.send(`There is no music queued. Add some with the \`play\` command.`);

	let i = 1;
	if (args[0]) {
		let parsed = parseInt(args[0]);
		if (!parsed) return message.channel.send('That\'s not a valid page number.');
		if (parsed < 1) return message.channel.send('There aren\'t negative pages.');
		parsed = Math.floor(parsed);
		if ((parsed - 1) * 10 > message.guild.music.queue.length) return message.channel.send(`There ${message.guild.music.queue.length < 11 ? 'is' : 'are'} only ${Math.ceil(message.guild.music.queue.length / 10)} page${message.guild.music.queue.length < 11 ? '' : 's'} in the queue.`);
		i = (parsed - 1) * 10 + 1;
	}

	let pars = i;
	let songArray = [];
	let queue = message.guild.music.queue;

	function iterate () {
		let obj = queue[i - 1];

		if (i !== 1) songArray.push(`${i}. ${obj.meta.queueName}`);

		i++;
		if (i <= pars + 9 && i <= queue.length) iterate();
		else message.channel.send('', {embed: {
			title: 'Now Playing: ' + queue[0].meta.title,
			url: queue[0].meta.url,
			description: songArray.join('\n'),
			color: 0x427df4,
			footer: {
				text: `Page ${Math.ceil(pars / 10)} of ${Math.ceil(message.guild.music.queue.length / 10)} | ${message.guild.music.queue.length} Song${message.guild.music.queue.length === 1 ? '' : 's'} Total`
			}
		}});
	}

	iterate();
};

exports.config = {
	enabled: true,
	permLevel: 2,
	aliases: ['queueueue', 'queueue', 'que', 'qu', 'q'],
	perms: ['EMBED_LINKS']
};

exports.help = {
	name: 'Queue',
	description: 'View the current queue',
	usage: 'queue <page>',
	help: 'View the current queue. View a different page if there are more than 10 songs.',
	category: 'Music'
};