const ytdl = require('ytdl-core');

let Music = {
	next: guild => {
		// if (guild.voiceConnection.dispatcher) guild.voiceConnection.dispatcher.end();

		let music = guild.music;
		music.queue = music.queue.slice(1);

		guild.music = music;

		if (music.queue.length === 0) {
			guild.voiceConnection.disconnect();
			guild.music = {};
			return;
		}

		setTimeout(() => {
			const stream = ytdl(music.queue[0].id, { filter: 'audioonly' });
			const dispatcher = guild.voiceConnection.playStream(stream);

			dispatcher.on('end', () => {
				Music.next(guild);
			});
		}, 50);
	}
};

module.exports = Music;