const fs = require('fs');

exports.run = (message, args, suffix, client) => {
	if (!client.config.owners.includes(message.author.id)) return;
	if (!args[0]) return message.channel.send('I can\'t delete nothing..');
	
	if (!fs.existsSync(`./commands/${suffix}.js`)) return message.channel.send(`There is no command by the name of ${suffix}`);
	else {
		message.channel.send(`Are you sure you want to delete ${suffix}? __**This action cannot be undone**__. <yes/no>\n*Command will be canceled in 10 seconds.*`);
		message.channel.awaitMessages(m => m.author.id == message.author.id, {max: 1, time: 10000, errors: ['time']}).then(collected => {
			let colMsg = collected.first();
			if (colMsg.content == 'no') return message.channel.send('Command canceled.');
			if (colMsg.content == 'yes') {
				try {
					fs.unlinkSync(`./commands/${suffix}.js`);
				} catch (err) {
					return message.channel.send(`Error removing ${suffix}: ${err}`);
				}
				message.channel.send(`Command ${suffix} removed successfully. Bye bye!`);
			}
		}).catch(col => {
			message.channel.send('Command canceled.');
		});
	}
};

exports.config = {
	enabled: true,
	permLevel: 10,
	aliases: []
};

exports.help = {
	name: 'Delete Command',
	description: 'Delete a command from Arthur.',
	usage: 'delcmd <command>',
	help: 'Seriously, just delete a command, and be asked a confirmation. How hard is that to understand?',
	category: 'Developer'
};