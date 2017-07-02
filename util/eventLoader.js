const reqEvent = event => require(`../events/${event}`);

module.exports = client => {
	client.on('message', reqEvent('message'));
	
	client.on('ready', () => reqEvent('console')(client, 'ready'));
	client.on('debug', bug => reqEvent('console')(bug, 'debug'));
	client.on('warn', warn => reqEvent('console')(warn, 'warn'));
	client.on('error', err => reqEvent('console')(err, 'error'));
};