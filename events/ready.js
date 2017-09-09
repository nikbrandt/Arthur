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
		'if you feel like this bot is crap, feel free to message Gymnophoria#8146 on how to make it less crap.'
	];

	client.user.setGame(`${games[Math.floor(Math.random() * games.length)]} | @Arthur help`);
}

module.exports = client => {
	console.log(`\nArthur has started! Currently in ${client.guilds.size} guilds, attempting to serve ${client.users.size} users. (${client.tempStopwatch.elapsedMilliseconds} ms)`);

	client.tempStopwatch.stop();
	client.tempStopwatch = undefined;

	client.owner = client.users.get(client.config.owners[0]);

	game(client);
	client.setInterval(() => {
		game(client);
	}, 120000);
};