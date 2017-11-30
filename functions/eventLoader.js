const { Stopwatch } = require('node-stopwatch');
const fs = require('fs');

module.exports = client => {
	let stopwatch = Stopwatch.create();
	let events = fs.readdirSync('./events');
	console.log(`Loading ${events.length} events..`);
	stopwatch.start();

	events.forEach(file => {
		console.log(`Loading ${file}..`);
		let eventName = file.split('.')[0];
		let event = require(`../events/${file}`);

		client.on(eventName, event.bind(null, client));
		console.log('Loaded.');
	});

	console.log(`Loaded ${events.length} events in ${stopwatch.elapsedMilliseconds} ms.\n`);
	stopwatch.stop();

	client.on('debug', d => {
		if (!d.includes('eartbeat')) console.log(d);
	});
	
	client.on('warn', console.warn);
	client.on('error', console.error);

	process.on('unhandledPromiseRejection', console.error);
	process.on('unhandledRejection', console.error);
	process.on('uncaughtException', console.error);
};