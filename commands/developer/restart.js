const fs = require('fs');

exports.run = async (message, args, suffix, client) => {
	let force = false;

	if (args[0] === '-f') force = true;

	let voice = (await client.shard.fetchClientValues('voice.connections.size')).reduce((prev, count) => prev + count, 0);
	let processing = (await client.shard.fetchClientValues('processing')).reduce((prev, processing) => {
		processing.forEach(item => {
			prev.push(item);
		});
		
		return prev;
	}, []);
	
	if ((voice || processing.length) && !force) {
		return message.channel.send(`I'm not gonna restart. ${voice ? `I've got ${voice} guild${voice !== 1 ? 's' : ''} listening to music through me..` : ''} ${processing.length ? `${voice ? '\n*and*' : ''} I've got the following things processing:\n${processing.map(p => `\`${p}\``).join('\n')}` : ''}\n*Bypass with -f*`);
	}

	const crashPath = require('path').join(__basedir, '..', 'media', 'temp', 'crash.txt');
	if (fs.existsSync(crashPath)) fs.unlink(crashPath, err => {
		if (err) console.error('Could not delete previous crash.txt file:\n', err.stack);
	});

	message.channel.send('Restarting all shards.').then(() => client.shard.respawnAll());
};

exports.config = {
	enabled: true,
	permLevel: 10,
	category: 'developer'
};