const fs = require('fs');
const sql = require('sqlite');
const ytdl = require('ytdl-core');
const request = require('request');
const isThatAnMp3 = require('is-mp3');
const orPerhapsOgg = require('is-ogg');
const readChunk = require('read-chunk');

function reverse (array) {
	let reversed = [];

	array.forEach(i => {
		reversed.unshift(i);
	});

	return reversed;
}


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
			} else if (music.queue[0].type === 2 || music.queue[0].type === 4) {
				let date = Date.now();
				let rng = Math.floor(Math.random() * 10000);
				let file = `../media/temp/${rng}-${date}.${music.queue[0].id.match(/\.([^.]+)$/)[1]}`;

				const r = request(music.queue[0].id, (err) => {
					if (err) return Music.next(guild);
				}).pipe(fs.createWriteStream(file));

				r.on('finish', () => {
					let buffer = readChunk.sync(file, 0, 4);
					if (!isThatAnMp3(buffer) && !orPerhapsOgg(buffer)) {
						Music.next(guild);
						fs.unlinkSync(file);
						return;
					}

					const stream = fs.createReadStream(file);
					dispatcher = guild.voiceConnection.playStream(stream);

					dispatcher.on('end', () => {
						fs.unlinkSync(file);
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
	},
	likedArray: async () => {
		let rows = await sql.all(`SELECT songLikes FROM misc`);
		let bigArray = [];

		for (let i = 0; i < rows.length; i++) { // parse and combine all entries
			let parsed = JSON.parse(rows[i].songLikes);

			for (let j = 0; j < parsed.length; j++) {
				bigArray.push(parsed[j]);
			}
		}

		let counts = {};

		for (let i = 0; i < bigArray.length; i++) { // gather amount of likes each song has
			let id = bigArray[i].id;
			counts[id] = counts[id] ? counts[id] + 1 : 1;
		}

		let almostThereBud = [];

		let keys = Object.keys(counts); // make an array of unique songs, no dupes
		for (let i = 0; i < keys.length; i++) {
			let obj = bigArray.find(o => o.id === keys[i]);
			almostThereBud.push(obj);
		}

		almostThereBud.sort((a, b) => { // sort array from smallest to biggest
			return counts[a.id] - counts[b.id];
		});

		almostThereBud = reverse(almostThereBud); // reverse array so it's biggest to smallest

		return [almostThereBud, counts];
	}
};

module.exports = Music;