const fs = require('fs');
const sql = require('sqlite');
const ytdl = require('ytdl-core');
const request = require('request');
const isThatAnMp3 = require('is-mp3');
const orPerhapsOgg = require('is-ogg');
const readChunk = require('read-chunk');
const search = require('youtube-search');

const YTRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)([A-z0-9_-]{11})(&.*)?$/;

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
	},

	parseMessage: (message, args, suffix, client) => {
		return new Promise(async (resolve, reject) => {
			let type = 1;
			let id;

			if (message.attachments.size) {
				type = 2;
				id = message.attachments.first().url;

				if (!id.endsWith('.mp3') && !id.endsWith('.ogg')) reject('I only support playback of mp3\'s and oggs for now. Go ahead and message Gymnophoria#8146 if you need another audio file type supported.');
				if (message.attachments.first().filesize < 25000) reject('Your file isn\'t powerful enough! I need one bigger than 25 KB, thanks.');

				resolve( {
					id: id,
					type: type
				} );
			} else if (args[0] === 'liked' || args[0] === 'likes') {
				let row = await sql.get(`SELECT songLikes FROM misc WHERE userID = '${message.author.id}'`);
				if (!row) reject('If you haven\'t liked a song yet, it\'s quite challenging for me to play a liked song.');

				let array = JSON.parse(row.songLikes);
				if (!array.length) reject('If you haven\'t liked a song yet, it\'s quite challenging for me to play a liked song.');

				if (!args[1]) reject('Yes, I\'ll just pick the song you want. Y\'know, because I have telepathic powers. (tell me which song to play)');
				let num = parseInt(args[1]);
				if (!num) reject('Hey.. that\'s not a number.. (or you chose zero, which really isn\'t a song number so yeah)');
				if (num < 1) reject('there is no negative song tho <:crazyeyes:359106555314044939>');
				if (num > array.length) reject('I\'m sorry, but you just haven\'t liked that many songs yet.');

				type = array[num - 1].type;
				id = array[num - 1].id;

				resolve( {
					id: id,
					type: type
				} );
			} else if (args[0] === 'top') {
				let thingy = await Music.likedArray();
				let array = thingy[0];

				if (!args[1]) reject('Yes, I\'ll just pick the song you want. Y\'know, because I have telepathic powers. (tell me which song to play)');
				let num = parseInt(args[1]);
				if (!num) reject('Hey.. that\'s not a number.. (or you chose zero, which really isn\'t a song number so yeah)');
				if (num < 1) reject('there is no negative song tho <:crazyeyes:359106555314044939>');
				if (num > array.length) reject('I\'m sorry, but there just aren\'t that many liked songs yet.');

				let obj = array[num - 1];
				type = obj.type;
				id = obj.id;

				resolve( {
					id: id,
					type: type
				} );
			} else if (args[0] === 'file') {
				type = 3;
				let files = fs.readdirSync('../media/sounds');
				files = files.map(f => f.replace(/\.mp3/g, ''));

				if (!args[1]) reject('Mhm, I\'ll make sure to play that nothingness real soon.');
				if (!files.includes(args[1])) reject(`Darn! That file doesn't exist. You can suggest to add it by DMing Gymnophoria#8146. The files you *can* play are as follows: ${files.map(f => '`' + f + '`').join(', ')}`);

				id = args[1];

				resolve ( {
					id: id,
					type: type
				} );
			} else if (YTRegex.test(args[0])) {
				id = args[0].match(YTRegex)[4];

				resolve ( {
					id: id,
					type: type
				} );
			} else if (args[0].endsWith('.mp3') || args[0].endsWith('.ogg')) {
				type = 4;
				id = args[0];

				resolve ( {
					id: id,
					type: type
				} );
			} else { //  if (!YTRegex.test(args[0]))
				let sOpts = {
					maxResults: 1,
					key: client.config.ytkey,
					type: 'video'
				};

				search(suffix, sOpts, (err, results) => {
					if (err || !results[0]) {
						if (message.guild.voiceConnection && !message.guild.music && !message.guild.music.queue[0]) message.guild.voiceConnection.disconnect();
						reject('The video you searched for does not exist.. rip');
					}

					id = results[0].id;
					console.log(results[0]);

					resolve ( {
						id: id,
						type: type
					} );
				});
			}
		})
	}
};

module.exports = Music;