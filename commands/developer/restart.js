const fs = require('fs');

exports.run = (message, args, suffix, client) => {
	let force = false;
	let voice;
	let processing;

	if (args[0] === '-f') force = true;

	if (client.voiceConnections.size) voice = true;
	if (client.processing.length) processing = true;

	if ((voice || processing) && force === false) {
		return message.channel.send(`I'm not gonna restart. ${voice ? `I've got ${client.voiceConnections.size} guild${client.voiceConnections.size !== 1 ? 's' : ''} listening to music through me..` : ''} ${processing ? `${voice ? '\n*and*' : ''} I've got the following things processing:\n${client.processing.map(p => `\`${p}\``).join('\n')}` : ''}\n*Bypass with -f*`);
	}

	const crashPath = require('path').join(__basedir, '..', 'media', 'temp', 'crash.txt');
	if (fs.existsSync(crashPath)) fs.unlink(crashPath, err => {
		if (err) console.error('Could not delete previous crash.txt file:\n', err.stack);
	});

	message.channel.send('Restarting.').then(m => process.exit(0));
};

exports.config = {
	enabled: true,
	permLevel: 10,
	category: 'developer'
};