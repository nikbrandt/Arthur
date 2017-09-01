const fs = require('fs');
const ytdl = require('ytdl-core');
const request = require('request');

let Music = {
	next: (guild, first) => {
		let music = guild.music;
		if (!first) music.queue = music.queue.slice(1);

		guild.music = music;

		if (music.queue.length === 0) {
			guild.voiceConnection.disconnect();
			guild.music = {};
			return;
		}

		setTimeout(() => {
			let dispatcher;

			if (music.queue[0].type === 1) {
				const stream = ytdl(music.queue[0].id, { filter: 'audioonly' });
				dispatcher = guild.voiceConnection.playStream(stream);

				dispatcher.on('end', () => {
					Music.next(guild);
				});
			} else if (music.queue[0].type === 2) {
				let date = Date.now();
				let rng = Math.floor(Math.random() * 10000);

				const r = request(music.queue[0].id).pipe(fs.createWriteStream(`../media/mp3temp/${rng}-${date}.mp3`));

				r.on('finish', () => {
					const stream = fs.createReadStream(`../media/mp3temp/${rng}-${date}.mp3`);
					dispatcher = guild.voiceConnection.playStream(stream);

					dispatcher.on('end', () => {
						fs.unlinkSync(`../media/mp3temp/${rng}-${date}.mp3`);
						Music.next(guild);
					});
				})
			}

			dispatcher.on('start', () => {
				guild.voiceConnection.player.streamingData.pausedTime = 0;
			});
		}, 50);
	}
};

module.exports = Music;