const { Stopwatch } = require('node-stopwatch');
const fs = require('fs');

let count = 0;

const loadCmd = (path, command, client) => {
	console.log(`Loading ${command}..`);
	let file = require(`${__dirname}/../commands/${path}`);
	client.commands.set(command.replace(/.js/g, ''), file);
	file.config.aliases.forEach(a => {
		client.aliases.set(a, command.replace(/.js/g, ''));
	});
	count++;
	console.log('Loaded.');
};

exports.loadCmd = loadCmd;

module.exports = async client => {
	let stopwatch = Stopwatch.create();
	console.log('Loading commands..');
	stopwatch.start();
	count = 0;

	const files = fs.readdirSync(`${__dirname}/../commands`);
	
	files.forEach(f => {
		try {
			if (fs.statSync(`${__dirname}/../commands/${f}`).isDirectory()) {
				let dFiles = fs.readdirSync(`${__dirname}/../commands/${f}`).filter(fi => fs.statSync(`${__dirname}/../commands/${f}/${fi}`).isFile());
				dFiles.forEach(dF => {
					loadCmd(`${f}/${dF}`, dF, client);
				});
			} else {
				if (f !== '.DS_Store') loadCmd(f, f, client);
			}
		} catch (err) {
			console.error(`Error loading ${f}:\n${err.stack ? err.stack : err}`);
		}
	});

	console.log(`Success! Loaded ${count} commands in ${stopwatch.elapsedMilliseconds} ms.\n`);
	stopwatch.stop();

	return [ count, stopwatch.elapsedMilliseconds ];
};