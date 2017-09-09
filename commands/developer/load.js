const load = require('../../functions/commandLoader');

exports.run = async (message, a, s, client) => {
	let msg = await message.channel.send('Reloading..');
	console.log('Reloading all commands via `load` command.');
	let ret = await load(client);
	msg.edit(`Done. Loaded ${ret[0]} commands in ${ret[1]} ms.`);
};

exports.config = {
	enabled: true,
	permLevel: 10,
	aliases: ['loadcmds']
};

exports.help = {
	name: 'Load Commands',
	description: 'Reloads all commands into memory.',
	usage: 'load <command>',
	help: 'Loads all commands into memory. ',
	category: 'Developer'
};