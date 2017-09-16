const fs = require('fs');
const ytdl = require('ytdl-core');
const request = require('request');
const readChunk = require('read-chunk');
const isThatAnMp3 = require('is-mp3');

let Music = {
	next: (guild, first) => {
		let music = guild.music;
		if (!music.queue) {
			if (guild.voiceConnection) guild.voiceConnection.disconnect();
			return;
		}
		if (!first) music.queue = music.queue.slice(1);

		guild.music = music;

		if (music.queue.length === 0) {
			guild.voiceConnection.disconnect();
			guild.music = {};
			return;
		}

		setTimeout(() => {
			let dispatcher;

			if (!guild.voiceConnection) {
				guild.music = {};
				return;
			}

			if (music.queue[0].type === 1) {
				const stream = ytdl(music.queue[0].id, { filter: 'audioonly' });
				dispatcher = guild.voiceConnection.playStream(stream);

				dispatcher.on('end', () => {
					Music.next(guild);
				});

				dispatcher.on('start', () => {
					guild.voiceConnection.player.streamingData.pausedTime = 0;
				});
			} else if (music.queue[0].type === 2) {
				let date = Date.now();
				let rng = Math.floor(Math.random() * 10000);

				const r = request(music.queue[0].id).pipe(fs.createWriteStream(`../media/temp/${rng}-${date}.mp3`));

				let buffer = readChunk.sync(`../media/temp/${rng}-${date}.mp3`, 0, 3);
				if (!isThatAnMp3(buffer)) {
					Music.next(guild);
					fs.unlinkSync(`../media/temp/${rng}-${date}.mp3`);
					return;
				}

				r.on('finish', () => {
					const stream = fs.createReadStream(`../media/temp/${rng}-${date}.mp3`);
					dispatcher = guild.voiceConnection.playStream(stream);

					dispatcher.on('end', () => {
						fs.unlinkSync(`../media/temp/${rng}-${date}.mp3`);
						Music.next(guild);
					});

					dispatcher.on('start', () => {
						guild.voiceConnection.player.streamingData.pausedTime = 0;
					});
				})
			} else if (music.queue[0].type === 3) {
				const stream = fs.createReadStream(`../media/sounds/${music.queue[0].id}.mp3`);
				dispatcher = guild.voiceConnection.playStream(stream);

				dispatcher.on('end', () => {
					Music.next(guild);
				});

				dispatcher.on('start', () => {
					guild.voiceConnection.player.streamingData.pausedTime = 0;
				});
			}
		}, 50);
	}
};

module.exports = Music;