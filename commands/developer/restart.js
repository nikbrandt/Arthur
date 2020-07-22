const fs = require('fs');

exports.run = async (message, args, suffix, client) => {
	let force = false;
	let manager = false;
	let check = false;

	if (args.includes('-f')) force = true;
	if (args.includes('-m')) manager = true;
	if (args.includes('-c')) check = true;

	if (check && (force || manager)) return message.channel.send('Incompatible arguments: -c and any other');
	
	let voice = (await client.broadcastEval('this.voice.connections.size')).reduce((prev, count) => prev + count, 0);
	let processing = (await client.broadcastEval('this.processing')).reduce((prev, processing) => {
		processing.forEach(item => {
			prev.push(item);
		});
		
		return prev;
	}, []);
	
	if ((voice || processing.length) && !force) {
		const reasonString = `${voice ? `I've got ${voice} guild${voice !== 1 ? 's' : ''} listening to music through me..` : ''} ${processing.length ? `${voice ? '\n*and*' : ''} I've got the following things processing:\n${processing.map(p => `\`${p}\``).join('\n')}` : ''}`;
		if (check) return message.channel.send(reasonString);
		else return message.channel.send(`I'm not gonna restart. ${reasonString}\n*Bypass with -f*`);
	}
	
	if (check) return message.channel.send('All good to restart.');

	const crashPath = require('path').join(__basedir, '..', 'media', 'temp', 'crash.txt');
	if (fs.existsSync(crashPath)) fs.unlink(crashPath, err => {
		if (err) client.errorLog('Could not delete previous crash.txt file', err);
	});

	if (manager) message.channel.send('Restarting shard manager/bot.').then(() => client.shard.send({ action: 'restart' }));
	else message.channel.send('Restarting all shards.').then(() => client.shard.respawnAll());
};

exports.config = {
	enabled: true,
	permLevel: 10,
	category: 'developer'
};