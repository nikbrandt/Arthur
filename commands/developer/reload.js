const fs = require('fs');
let folders = [''];

exports.run = (message, args, suffix, client) => {
	if (!args[0]) return message.channel.send('I can\'t reload nothing <:thonk:281211813494915083>');
	let cmd = args[0];

	let isAlias = false;
	let isNotCommand = false;
	let comm = client.commands.get(cmd);
	if (!comm) {
		comm = client.commands.get(client.aliases.get(cmd));
		if (comm) isAlias = true;
	}
	if (!comm) {
		if (fs.existsSync(`${__basedir}/${suffix}`)) isNotCommand = true;
		else return message.channel.send(`\`${cmd}\` is not a command nor is \`${suffix}\` a file. (try using ./)`);
	}

	if (!isNotCommand) {
		fs.readdirSync(`${__dirname}/../`).filter(f => fs.statSync(`${__dirname}/../${f}`).isDirectory()).forEach(d => folders.push(d));

		let command;
		try {
			folders.forEach(fold => {
				try {
					delete require.cache[require.resolve(`${__dirname}/../${fold ? `${fold}/` : ''}${isAlias ? client.aliases.get(args[0]) : args[0]}.js`)];
					command = require(`${__dirname}/../${fold ? `${fold}/` : ''}${isAlias ? client.aliases.get(args[0]) : args[0]}.js`);
				} catch (e) {}
			});
		} catch (err) {
			return message.channel.send(`Error with require cache: \n${err}`);
		}

		client.commands.delete(cmd);
		client.commands.set(cmd, command);
		client.aliases.forEach((cm, alias) => {
			if (cm === cmd) client.aliases.delete(alias);
		});
		// noinspection JSUnusedAssignment
		command.config.aliases.forEach(alias => {
			client.aliases.set(alias, cmd);
		});

		message.channel.send(`The ${suffix.includes('/') ? '*' + suffix.split('/').slice(0, -1) + '*/**' + suffix.split('/')[suffix.split('/').length - 1].charAt(0) + suffix.split('/')[suffix.split('/').length - 1].slice(1) : '**' + suffix}** command has been reloaded.`);
	} else {
		try {
			delete require.cache[require.resolve(`${__basedir}/${suffix}`)];
		} catch (e) {
			return message.channel.send(`Could not reload - \`${e.name}\``);
		}

		message.channel.send(`Successfully reloaded \`${suffix}\``);
	}
};

exports.config = {
	enabled: true,
	permLevel: 10,
	category: 'developer'
};
