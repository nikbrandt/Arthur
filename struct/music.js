const ytdl = require('ytdl-core');

module.exports = {
	next: async guild => {
		let music = guild.music;
		music.queue = music.queue.slice(1);

		if (music.queue.length === 0) {
			guild.music.channel.leave();
			guild.music = {};
			return;
		}

		const stream = ytdl(music.queue[0].id);
		const dispatcher = guild.voiceConnection.playStream(stream);

		guild.music = music;

		dispatcher.on('end', () => {
			this.next(guild);
		});
	}
};