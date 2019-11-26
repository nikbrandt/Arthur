const maximumRolls = 100;
const diceFormat = /(?<rollCount>[\d]*d)?(?<sideCount>[\d]+)?(?<additive>\+[\d]+)?/;

exports.run = (message, args) => {
	let rollCount = 1;
	let numberOfSides = 6;
	let additive = 0;

	if (args[0]) {
		let result = diceFormat.exec(args[0]);
		if (result.groups.rollCount) {
			let slice = result.groups.rollCount.slice(0, result.groups.rollCount.length - 1);
			if (slice.length !== 0) {
				let number = parseInt(slice);
				if (!number) return message.channel.send(message.__('invalid_number'));
				if (number < 1) return message.channel.send(message.__('negative_number'));
				rollCount = number;
			}
		}

		if (result.groups.sideCount) {
			let number = parseInt(result.groups.sideCount);
			if (!number) return message.channel.send(message.__('invalid_sides'));
			if (number < 1) return message.channel.send(message.__('negative_number'));
			numberOfSides = number;
		}

		if (result.groups.additive) {
			let number = parseInt(result.groups.additive);
			if (!number) return message.channel.send(message.__('invalid_number'));
			additive = number;
		}
	}

	if (rollCount > maximumRolls)
		return message.channel.send(message.__('excessive_rolls'));

	let summationArray = [];
	let summation = 0;
	for (let i = 0; i < rollCount; i++) {
		let num = Math.floor((Math.random() * numberOfSides) + 1);
		summationArray.push(num);
		summation += num;
	}
	
	if (additive > 0) summation += additive;
	
	let successMessage;
	if (additive === 0 && rollCount === 1) successMessage = message.__('success_roll', { result: summation });
	else if (additive === 0) successMessage = message.__('success_roll_multiple', { roll: '**' + summationArray.join('** + **') + '**', result: summation });
	else successMessage = message.__('success_roll_multiple', { roll: '(**' + summationArray.join('** + **') + '**) + **' + additive + '**', result: summation });
	
	if (successMessage.length > 2000) message.channel.send(message.__('success_roll', { result: summation }));
	else message.channel.send(successMessage);
};

exports.config = {
	enabled: true,
	permLevel: 1,
	category: 'fun'
};