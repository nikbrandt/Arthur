const { exec } = require('child_process');

exports.run = (message, args, suffix, client) => {
	let reload = false;
	let kys = false;
	if (args[0] === '-r') reload = true;
	if (args[0] === '-k' || args[0] === '-kys') kys = true;
	
	exec('git pull', (error, stdout) => {
		if (error) return message.channel.send(`Received error: \`\`\`shell\n${error.stack}\`\`\``);
		
		if (stdout.includes('up to date.')) return message.channel.send('Already up to date.');
		if (stdout.includes('changed, ')) {
			message.channel.send(`Pulled successfully <:discreetkappa:474445143974608898> ${kys ? '- Killing self now.' : ''}${reload ? '- Reloading commands now.' : ''}`);
			if (kys) client.commands.get('restart').run(message, args, suffix, client);
			else if (reload) client.commands.get('load').run(message, args, suffix, client);
			return;
		}
		
		message.channel.send(`Unexpected output: \`\`\`shell\n${stdout}\n\`\`\``)
	});
};

exports.config = {
	enabled: true,
	permLevel: 10,
	category: 'developer'
};