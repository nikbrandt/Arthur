const fs = require('fs');

let count = 0;
let i = -1;

const loadCmd = (path, command, client, reload) => {
	let commandPath = `${__dirname}/../commands/${path}`;
	
	if (reload) delete require.cache[require.resolve(commandPath)];
	let file = require(commandPath);
	
	client.commands.set(command.replace(/.js/g, ''), file);
	count++;
	i++;
	if (i % 10 === 0) {
		console.log('');
		process.stdout.write('   ');
	}
	process.stdout.write(`${command.slice(0, -3)} `);
};

const soundEffects = (client) => {
	process.stdout.write('   ');
	let effects = fs.readdirSync('../media/sounds');
	effects.forEach(file => {
		let basename = file.replace('.mp3', '');
		client.commands.set(basename, {
			run: (message, args, suffix, client) => {
				message.__ = (string, variables) => {
					return i18n.get('commands.play.' + string, message, variables);
				};
				
				client.commands.get('play').run(message, ['file', basename], suffix, client);
			},
			config: {
				enabled: true,
				permLevel: 2,
				aliases: [],
				perms: ['EMBED_LINKS', 'SPEAK', 'CONNECT'],
				guildCooldown: 1000,
				category: 'sound_effects'
			}
		});
		count++;
		process.stdout.write(file.slice(0, -4) + ' ');
	})
};

exports.loadCmd = loadCmd;

module.exports = (client, reload) => {
	let start = Date.now();
	process.stdout.write('Loading commands..');
	count = 0;

	const files = fs.readdirSync(`${__dirname}/../commands`);
	
	files.forEach(f => {
		try {
			if (fs.statSync(`${__dirname}/../commands/${f}`).isDirectory()) {
				let dFiles = fs.readdirSync(`${__dirname}/../commands/${f}`).filter(fi => fs.statSync(`${__dirname}/../commands/${f}/${fi}`).isFile());
				dFiles.forEach(dF => {
					try {
						if (dF !== '.DS_Store') loadCmd(`${f}/${dF}`, dF, client, reload);
					} catch (err) {
						console.error(`Error loading ${f}/${dF}:\n${err.stack ? err.stack : err}`);
					}
					
				});
			} else {
				if (f !== '.DS_Store') loadCmd(f, f, client);
			}
		} catch (err) {
			console.error(`Error loading ${f}:\n${err.stack ? err.stack : err}`);
		}
	});

	console.log();

	console.log('Generating sound effect commands..');
	soundEffects(client);

	console.log();

	console.log(`Success! Loaded ${count} commands in ${Date.now() - start} ms.\n`);
	return [ count, Date.now() - start ];
};