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

const soundEffects = (client) => {
	let effects = fs.readdirSync('../media/sounds');
	effects.forEach(file => {
		console.log(`Generating file for ${file}..`);
		let basename = file.replace('.mp3', '');
		client.commands.set(basename, {
			run: (message, args, suffix, client) => {
				client.commands.get('play').run(message, ['file', basename], suffix, client);
			},
			config: {
				enabled: true,
				permLevel: 2,
				aliases: [],
				perms: ['EMBED_LINKS', 'SPEAK', 'CONNECT'],
				guildCooldown: 1000
			},
			help: {
				name: basename.charAt(0).toUpperCase() + basename.slice(1),
				description: `Alias for \`play file ${basename}\``,
				usage: basename,
				help: `Alias for \`play file ${basename}\`. Plays the \`${basename}\` sound effect.`,
				category: 'Sound Effects'
			}
		});
		count++;
		console.log('Done.');
	})
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

	console.log('Generating sound effect commands..');
	soundEffects(client);

	console.log(`Success! Loaded ${count} commands in ${stopwatch.elapsedMilliseconds} ms.\n`);
	stopwatch.stop();

	return [ count, stopwatch.elapsedMilliseconds ];
};