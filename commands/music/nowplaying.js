const ytdl = require('ytdl-core');

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

function secString(secObj) {
	return `${secObj.h ? `${secObj.h}h ` : ''}${secObj.m ? `${secObj.m}m ` : ''}${secObj.s}s`;
}

exports.run = (message, args, s, client, permLevel) => {
	if (args[0] && (args[0] === 'n' || args[0] === 'notify')) {
		if (permLevel > 2) client.commands.get('npnotify').run(message);
		else message.react(':missingpermissions:407054344874229760').catch(() => {});

		return;
	}

	if (!message.guild.music || !message.guild.music.queue) return message.channel.send('Now playing: The sound of silence.');

	if (message.guild.music.queue[0].type === 1) { // YouTube video
		ytdl.getInfo(message.guild.music.queue[0].id).then(info => {
			let secObj = secSpread(info.length_seconds);

			let data = message.guild.voiceConnection.player.streamingData;
			let remainingTime = Math.round((Date.now() - (data.startTime - data.pausedTime)) / 1000);

			message.channel.send({
				embed: {
					author: {
						name: 'Now Playing',
						icon_url: info.author.avatar
					},
					color: 0xff0000,
					description: `[${info.title}](https://www.youtu.be/${message.guild.music.queue[0].id})
By [${info.author.name}](${info.author.channel_url})
${secString(secSpread(remainingTime))} of ${secString(secObj)}`,
					thumbnail: {
						url: info.iurlhq
					},
					footer: {
						text: `Requested by ${message.guild.music.queue[0].person.tag}`
					}
				}
			});
		});
	} else if (message.guild.music.queue[0].type === 5) { // soundcloud
		let data = message.guild.voiceConnection.player.streamingData;
		let remainingTime = Math.round((Date.now() - (data.startTime - data.pausedTime)) / 1000);

		let embed = message.guild.music.queue[0].embed;
		embed.author.name = 'Now Playing';
		embed.description = embed.description.replace(/Length: /g, `**${secString(secSpread(remainingTime))}** of `);

		message.channel.send({embed})
	} else if (message.guild.music.queue[0].type >= 2) { // User-provided file
		message.channel.send({
			embed: {
				author: {
					name: 'Now Playing'
				},
				url: message.guild.music.queue[0].meta.url,
				color: 0x7289DA,
				description: message.guild.music.queue[0].meta.title
			}
		});
	}
};

exports.config = {
	enabled: true,
	permLevel: 2,
	aliases: ['playing', 'np'],
	perms: ['EMBED_LINKS']
};

exports.help = {
	name: 'Now Playing',
	description: 'See what song is currently playing',
	usage: 'nowplaying',
	help: 'Get information about the currently playing song.',
	category: 'Music'
};