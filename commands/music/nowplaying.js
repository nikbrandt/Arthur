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

exports.run = (message) => {
	if (!message.guild.music || !message.guild.music.queue) return message.channel.send('Now playing: The sound of silence.');

	if (message.guild.music.queue[0].type === 1) { // YouTube video
		ytdl.getInfo(message.guild.music.queue[0].id).then(info => {
			let secObj = secSpread(info.length_seconds);

			message.channel.send({
				embed: {
					author: {
						name: 'Now Playing',
						icon_url: info.author.avatar
					},
					color: 0x427df4,
					description: `[${info.title}](https://www.youtu.be/${message.guild.music.queue[0].id})\nBy [${info.author.name}](${info.author.channel_url})\nLength: ${secObj.h ? `${secObj.h}h ` : ''}${secObj.m ? `${secObj.m}m ` : ''}${secObj.s}s`,
					thumbnail: {
						url: info.iurlhq
					},
					footer: {
						text: `Requested by ${message.guild.music.queue[0].person.tag}`
					}
				}
			});
		});
	} else if (message.guild.music.queue[0].type === 2) { // User-provided file
		message.channel.send({
			embed: {
				author: {
					name: 'Now Playing'
				},
				color: 0x427df4,
				description: `A song provided by ${message.guild.music.queue[0].person.tag}`
			}
		});
	}
};

exports.config = {
	enabled: true,
	permLevel: 2,
	aliases: ['playing', 'np']
};

exports.help = {
	name: 'Now Playing',
	description: 'See what song is currently playing',
	usage: 'nowplaying',
	help: 'Get information about the currently playing song.',
	category: 'Music'
};