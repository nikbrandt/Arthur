const ytdl = require('ytdl-core');

let Music = {
	next: guild => {
		let music = guild.music;
		music.queue = music.queue.slice(1);

		guild.music = music;

		if (music.queue.length === 0) {
			guild.voiceConnection.disconnect();
			guild.music = {};
			return;
		}

		const stream = ytdl(music.queue[0].id, { filter: 'audioonly' });
		const dispatcher = guild.voiceConnection.playStream(stream);

		dispatcher.on('end', () => {
			Music.next(guild);
		});
	}
};

module.exports = Music;