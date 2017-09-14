const canvas = require('canvas');
const moment = require('moment');

exports.run = (message, args, suffix, client) => {
	let object;

	if (args[0] === 'weekly') {
		if (!client.weeklyStatsObject[moment().format('W/YYYY')]) return message.channel.send('Not enough commands have been used, somehow');
		object = client.weeklyStatsObject[moment().format('W/YYYY')];
	} else if (args[0] === 'daily') {
		if (!client.dailyStatsObject[moment().format('M/D/YYYY')]) return message.channel.send('Not enough commands have been used, apparently');
		object = client.dailyStatsObject[moment().format('M/D/YYYY')];
	} else {
		let keys = Object.keys(client.commandStatsObject);
		let values = Object.values(client.commandStatsObject);
		let temp = {};

		for (let i = 0; i < keys.length; i++) {
			temp[keys[i]] = values[i].uses;
		}

		object = temp;
	}

	let keys = Object.keys(object);
	let values = Object.values(object);
	let array = [];

	for (let i = 0; i < keys.length; i++) {
		array.push(`${keys[i]}: ${values[i]} uses`);
	}

	message.channel.send(`Here, have a temporary list that will someday be a glorious image:\n${array.join('\n')}`);
};

exports.config = {
	enabled: true,
	permLevel: 10,
	aliases: []
};

exports.help = {
	name: 'Command Stats',
	description: 'View command stats of the bot.',
	usage: 'stats [total/weekly/daily]',
	help: 'View statistics on commands used, defaults to total.',
	category: 'Developer'
};