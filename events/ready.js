const moment = require('moment');
const fs = require('fs');

const { watch } = require('../commands/fun/poll');
const ipc = require('../struct/ipc');

async function game (client) {
	let games = [
		[ 'Invite me to your server with the "invite" command.', 'PLAYING' ],
		[ `${(await client.broadcastEval('this.guilds.cache.size')).reduce((prev, cur) => prev + cur, 0)} servers do their things`, 'WATCHING' ],
		[ `${(await client.broadcastEval('this.users.cache.size')).reduce((prev, cur) => prev + cur, 0)} users very closely`, 'WATCHING' ],
		[ 'with the webshot command', 'PLAYING' ],
		[ 'The lovely mp3 command', 'LISTENING' ],
		[ 'what do i put here', 'PLAYING' ],
		[ 'SOUNDCLOUD SUPPOOORRRRTTTT', 'LISTENING' ],
		[ 'talk to me im lonely', 'PLAYING' ],
		[ 'honestly the best way to code is by etching engravings into your hard drive', 'PLAYING' ],
		[ 'enable hot levels with the levels command', 'PLAYING' ],
		[ 'are you feeling sad? look at a cat and feel happy for a few seconds.', 'PLAYING' ],
		[ 'feeling like you need help with life? have the 8ball make all your choices.', 'PLAYING' ],
		[ 'don\'t like my prefix? weirdo. change it with the "prefix" command.', 'PLAYING' ],
		[ '( ͡° ͜ʖ ͡°)', 'PLAYING' ],
		[ 'if you feel like this bot is crap, feel free to \'a.suggest\' on how to make it less crap.', 'PLAYING' ],
		[ 'join my server so my dev feels popular - click "Support Server" in the help command', 'PLAYING' ],
		[ 'did you know that you\'re a nerd?', 'PLAYING' ],
		[ 'mmm sexy polls i think', 'PLAYING' ],
		[ 'you.', 'WATCHING' ],
		[ 'the screams of.. uh.. nevermind..', 'LISTENING' ],
		[ `simultaneously with all of you ;)`, 'PLAYING' ],
		[ 'the Earth burn as I hitch a ride with the Vogons', 'WATCHING' ],
		[ 'Help translate Arthur! Join the support server and ask how you can.', 'PLAYING' ]
	];

	let array = games[Math.floor(Math.random() * games.length)];
	client.user.setActivity(`${array[0]} | @Arthur help`, { type: array[1] }).catch(() => {});
}

function sendStats(client) {
	client.shard.send({
		action: 'updateStats',
		commands: client.commandStatsObject,
		daily: client.dailyStatsObject,
		weekly: client.weeklyStatsObject
	}).then(() => {
		client.commandStatsObject = {};
		client.dailyStatsObject = {};
		client.weeklyStatsObject = {};
	});
}

function cleanProcesses(client) {
	client.voice.connections.forEach(connection => {
		if (!connection.channel
			|| connection.channel.members.size < 2
			|| !connection.channel.guild
			|| !connection.channel.guild.music
			|| !connection.channel.guild.music.queue
		) {
			if (connection.channel.guild && connection.channel.guild.music) connection.channel.guild.music = {};

			connection.disconnect();
			connection.channel.leave();
		}
	});

	client.processing.forEach((item, i) => {
		if (typeof item !== 'string') return;

		let start = moment(item.split(' - ')[0], 'h:mm:ss A').valueOf();
		if (Date.now() - start > 600000) client.processing.splice(i, 1); // 600000 ms = 10 minutes
	});
}

module.exports = client => {
	if (Date.now() - client.loadStart > 300000) return;
	console.log(`\n${client.test ? 'Testbot' : 'Arthur'} has started! Currently in ${client.guilds.cache.size} guilds, attempting to serve ${client.users.cache.size} users. (${Date.now() - client.loadStart} ms)\n`);

	/*if (!client.test)*/ ipc(client);

	client.recentMessages = {};
	client.lastRecentMessageID = 0;

	game(client);
	client.setInterval(() => {
		game(client);
	}, 1000 * 60 * 5);

	client.setInterval(() => {
		cleanProcesses(client);
	}, 600000);

	if (!client.test) {
		client.setInterval(() => {
			sendStats(client);
		}, 30000);/*

		dbots.getLikes(client);
		client.setInterval(() => {
			dbots.getLikes(client);
		}, 600000);*/
	}

	sql.all('SELECT * FROM pollReactionCollectors').then(results => {
		let parsed = [];

		results.forEach(obj => {
			let options = JSON.parse(obj.options);
			let embed = JSON.parse(obj.embed);
			parsed.push({
				channelID: obj.channelID,
				messageID: obj.messageID,
				options,
				endDate: obj.endDate,
				embed
			});
		});

		parsed.forEach(obj => {
			let channel = client.channels.cache.get(obj.channelID);
			if (!channel) return;
			channel.messages.fetch(obj.messageID).then(msg => {
				watch(msg, obj.options, obj.endDate, client, obj.embed);
			}).catch(() => {
				sql.run('DELETE FROM pollReactionCollectors WHERE messageID = ?', [obj.messageID]).catch(console.log);
			})
		});
	}).catch(client.errorLog.simple);

	const crashPath = require('path').join(__basedir, '..', 'media', 'temp', 'crash.txt');
	if (fs.existsSync(crashPath)) fs.readFile(crashPath, 'utf8', (err, data) => {
		if (err) return client.errorLog('Error loading previous error', err);

		let datarray = data.split('\n');
		const code = datarray.shift();
		const stack = datarray.join('\n');

		client.errorLog('Previous crash error', { stack, code }, true);

		fs.unlink(crashPath, err => {
			if (err) client.errorLog('Could not delete previous crash.txt file', err);
		});
	});
};
