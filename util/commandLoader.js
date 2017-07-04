const fs = require('fs');
const { promisify } = require('util');
const readdir = promisify(fs.readdir);

const loadCmd = (path, command, client) => {
	console.log(`Loading ${command}..`);
	let file = require(`${__dirname}/../commands/${path}`);
	client.commands.set(command.replace(/.js/g, ''), file);
	file.config.aliases.forEach(a => {
		client.aliases.set(a, command.replace(/.js/g, ''));
	});
};

exports.loadCmd = loadCmd;

module.exports = async client => {
	const files = await readdir(`${__dirname}/../commands`);
	
	files.forEach(f => {
		try {
			if (fs.statSync(`${__dirname}/../commands/${f}`).isDirectory()) {
				let dFiles = fs.readdirSync(`${__dirname}/../commands/${f}`).filter(fi => fs.statSync(`${__dirname}/../commands/${f}/${fi}`).isFile());
				dFiles.forEach(dF => {
					loadCmd(`${f}/${dF}`, dF, client);
				});
			} else {
				loadCmd(f, f, client);
			}
		} catch (err) {
			console.error(`Error loading ${f}:\n${err.stack ? err.stack : err}`);
		}
	});
};