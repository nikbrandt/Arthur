const ytdl = require('ytdl-core');

const Music = require('../../struct/Music');
const { timeString } = require('../../struct/Util.js');

exports.run = (message, args, s, client, permLevel) => {
	if (args[0] && (args[0] === message.__('notify') || args[0] === message.__('notify_abbreviation'))) {
		if (permLevel > 2) client.commands.get('npnotify').run(message);
		else message.react(':missingpermissions:407054344874229760').catch(() => {});

		return;
	}

	if (!message.guild.music || !message.guild.music.queue) return message.channel.send(message.__('nothing_playing'));

	const locale = i18n.getLocaleCode(message);
	const queueItem = message.guild.music.queue[0];

	if (queueItem.type === 1) { // YouTube video
		const ellapsedTime = Music.calculateEllapsedTime(message.guild);
		const embed = queueItem.embed;

		embed.author.name = i18n.getString('struct.music.now_playing', locale);
		embed.description = embed.description.split('\n').slice(0, -1).join('\n') + `\n${timeString(ellapsedTime, locale)} ${message.__('of')} ${timeString(queueItem.meta.length, locale)}`;

		message.channel.send({ embeds: [ embed ] }).then(msg => {
			Music.addReactionCollector(msg, client, ellapsedTime * 1000);
		});
	} else if (queueItem.type === 5) { // soundcloud
		let elapsedTime = Math.round(message.guild.me.voice.connection.dispatcher.totalStreamTime / 1000);

		let embed = queueItem.embed;
		embed.author.name = i18n.getString('struct.music.now_playing', locale);
		embed.description = embed.description.replace(i18n.getString('struct.music.length', locale) + ': ', `**${timeString(elapsedTime, locale)}** ${message.__('of')} `);

		message.channel.send({ embeds: [ embed ] }).then(msg => {
			Music.addReactionCollector(msg, client, elapsedTime * 1000);
		});
	} else if (queueItem.type >= 2) { // User-provided file
		message.channel.send({
			embeds: [{
				author: {
					name: i18n.getString('struct.music.now_playing', locale)
				},
				url: queueItem.meta.url,
				color: 0x7289DA,
				description: queueItem.meta.title
			}]
		}).then(msg => {
			Music.addReactionCollector(msg, client);
		});
	}
};

exports.config = {
	enabled: true,
	permLevel: 2,
	perms: ['EMBED_LINKS'],
	category: 'music'
};
