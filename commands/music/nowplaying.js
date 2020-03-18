const ytdl = require('ytdl-core');
const Music = require('../../struct/music');

function secSpread(sec) {
	let hours = Math.floor(sec / 3600);
	let mins = Math.floor((sec - hours * 3600) / 60);
	let secs = sec - (hours * 3600 + mins * 60);
	return {
		h: hours,
		m: mins,
		s: secs
	}
}

function secString(secObj, locale) {
	return `${secObj.h ? `${secObj.h}${i18n.getString('time.abbreviations.hours', locale)} ` : ''}${secObj.m ? `${secObj.m}${i18n.getString('time.abbreviations.minutes', locale)} ` : ''}${secObj.s}${i18n.getString('time.abbreviations.seconds', locale)}`;
}

exports.run = (message, args, s, client, permLevel) => {
	if (args[0] && (args[0] === message.__('notify') || args[0] === message.__('notify_abbreviation'))) {
		if (permLevel > 2) client.commands.get('npnotify').run(message);
		else message.react(':missingpermissions:407054344874229760').catch(() => {});

		return;
	}

	if (!message.guild.music || !message.guild.music.queue) return message.channel.send(message.__('nothing_playing'));

	const locale = i18n.getLocaleCode(message);
	
	if (message.guild.music.queue[0].type === 1) { // YouTube video
		ytdl.getInfo(message.guild.music.queue[0].id).then(info => {
			let secObj = secSpread(info.length_seconds);

			let data = message.guild.voice.connection.player.streamingData;
			let remainingTime = Math.round((Date.now() - (data.startTime - data.pausedTime)) / 1000);

			message.channel.send({
				embed: {
					author: {
						name: i18n.getString('struct.music.now_playing', locale),
						icon_url: info.author.avatar
					},
					color: 0xff0000,
					description: `[${info.title}](https://www.youtu.be/${message.guild.music.queue[0].id})
${message.__('by')} [${info.author.name}](${info.author.channel_url})
${secString(secSpread(remainingTime), locale)} ${message.__('of')} ${secString(secObj, locale)}`,
					thumbnail: {
						url: info.iurlhq
					},
					footer: {
						text: message.__('footer', { tag: message.guild.music.queue[0].person.tag })
					}
				}
			}).then(msg => {
				Music.addReactionCollector(msg, client, remainingTime * 1000);
			});
		});
	} else if (message.guild.music.queue[0].type === 5) { // soundcloud
		let data = message.guild.voice.connection.player.streamingData;
		let remainingTime = Math.round((Date.now() - (data.startTime - data.pausedTime)) / 1000);

		let embed = message.guild.music.queue[0].embed;
		embed.author.name = i18n.getString('struct.music.now_playing', locale);
		embed.description = embed.description.replace(i18n.getString('struct.music.length', locale) + ': ', `**${secString(secSpread(remainingTime), locale)}** ${message.__('of')} `);

		message.channel.send({embed}).then(msg => {
			Music.addReactionCollector(msg, client, remainingTime * 1000);
		});
	} else if (message.guild.music.queue[0].type >= 2) { // User-provided file
		message.channel.send({
			embed: {
				author: {
					name: i18n.getString('struct.music.now_playing', locale)
				},
				url: message.guild.music.queue[0].meta.url,
				color: 0x7289DA,
				description: message.guild.music.queue[0].meta.title
			}
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