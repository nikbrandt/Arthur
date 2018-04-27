const { statusUpdate } = require('../functions/eventLoader');
const dbots = require('../functions/dbots');
const fs = require('fs');

function game (client) {
	let games = [
		'Invite me to your server with the "invite" command.',
		`In ${client.guilds.size} servers`,
		`Serving ${client.users.size} users.`,
		'The webshot command is pretty cool',
		'Check out the mp3 command',
		'what do i put here',
		'honestly the best way to code is by etching engravings into your hard drive',
		'enable hot levels with the levels command',
		'are you feeling sad? look at a cat and feel happy for a few seconds.',
		'feeling like you need help with life? have the 8ball make all your choices.',
		'don\'t like my prefix? weirdo. change it with the "prefix" command.',
		'( ͡° ͜ʖ ͡°)',
		'if you feel like this bot is crap, feel free to message Gymnophoria#8146 on how to make it less crap.',
		'join my server so my dev feels popular - click "Support Server" in the help command'
	];

	client.user.setActivity(`${games[Math.floor(Math.random() * games.length)]} | @Arthur help`).catch();
}

function writeStats (client) {
	fs.writeFileSync('../media/stats/commands.json', JSON.stringify(client.commandStatsObject));
	fs.writeFileSync('../media/stats/daily.json', JSON.stringify(client.dailyStatsObject));
	fs.writeFileSync('../media/stats/weekly.json', JSON.stringify(client.weeklyStatsObject));
}

function purgeEmptyVoiceConnections (client) {
	let connections = client.voiceConnections;
	if (connections.size === 0) return;

	connections.forEach(conn => {
		if (!conn.channel.guild.music || !conn.channel.guild.music.queue) conn.disconnect();
	});
}

module.exports = client => {
	console.log(`\n${client.test ? 'Testbot' : 'Arthur'} has started! Currently in ${client.guilds.size} guilds, attempting to serve ${client.users.size} users. (${client.tempStopwatch.elapsedMilliseconds} ms)\n`);

	if (!client.test) dbots.post(client);

	client.tempStopwatch.stop();
	client.tempStopwatch = undefined;

	client.owner = client.users.get(client.config.owners[0]);

	if (!client.test) {
		let tempItems = fs.readdirSync('../media/temp');
		if (tempItems) tempItems.forEach(i => {
			fs.unlinkSync(`../media/temp/${i}`);
		});
	}

	game(client);
	client.setInterval(() => {
		game(client);
	}, 120000);

	client.setInterval(() => {
		purgeEmptyVoiceConnections(client);
	}, 600000);

	if (!client.test) {
		client.setInterval(() => {
			writeStats(client);
		}, 30000);/*

		dbots.getLikes(client);
		client.setInterval(() => {
			dbots.getLikes(client);
		}, 600000);*/
	}

	statusUpdate({
		title: 'Bot started',
		timestamp: new Date().toISOString(),
		color: 0x00c140
	})
};