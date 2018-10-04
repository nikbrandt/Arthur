exports.run = (message, args) => {
	let numberOfSides = 6;
	if (args[0]) {
		let number = parseInt(args[0]);
		if (!number) return message.channel.send(message.__('invalid_number'));
		if (number < 1) return message.channel.send(message.__('negative_number'));
		numberOfSides = number;
	}

	let diceRoll = Math.floor((Math.random() * numberOfSides) + 1);
	let successMessage = message.__('success_roll');
	message.channel.send({
		embed: {
			description: `${successMessage} ${diceRoll}`,
			color: 0x00c140
		}
	});
};

exports.config = {
	enabled: true,
	permLevel: 1,
	aliases: ['roll']
};

exports.help = {
	name: 'Dice',
	description: 'Rolls a dice',
	usage: 'dice [number of sides]',
	help: 'Ask Arthur to roll an arbitrarily sized dice',
	category: 'Fun'
};
