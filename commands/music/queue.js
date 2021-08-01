const { calculateQueueLength } = require('../../struct/Music.js');
const { timeString } = require('../../struct/Util.js');

exports.run = async (message, args) => {
	if (!message.guild.music || !message.guild.music.queue) return message.channel.send(message.__('no_music_queued'));

	let i = 1;
	if (args[0]) {
		let parsed = parseInt(args[0]);
		if (!parsed) return message.channel.send(i18n.get('commands.liked.invalid_page', message));
		if (parsed < 1) return message.channel.send(i18n.get('commands.liked.negative_page', message));
		parsed = Math.floor(parsed);
		if ((parsed - 1) * 10 > message.guild.music.queue.length) return message.channel.send(message.guild.music.queue.length < 11
				? message.__('only_one_page')
				: message.__('only_multiple_pages', { pages: Math.ceil(message.guild.music.queue.length / 10) }));
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
			title: i18n.get('struct.music.now_playing', message) + ' ' + queue[0].meta.title,
			url: queue[0].meta.url,
			description: songArray.join('\n'),
			color: 0x427df4,
			footer: {
				text: message.guild.music.queue.length === 1
					? message.__('footer', { page: Math.ceil(pars / 10),
						maxPage: Math.ceil(message.guild.music.queue.length / 10),
						length: timeString(calculateQueueLength(message.guild), message),
						name: message.member.displayName })
					: message.__('footer_plural', { page: Math.ceil(pars / 10),
						maxPage: Math.ceil(message.guild.music.queue.length / 10),
						songs: message.guild.music.queue.length,
						length: timeString(calculateQueueLength(message.guild), message),
						name: message.member.displayName })
			}
		}});
	}

	iterate();
};

exports.config = {
	enabled: true,
	permLevel: 2,
	perms: ['EMBED_LINKS'],
	category: 'music'
};
