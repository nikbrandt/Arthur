const { Stopwatch } = require('node-stopwatch');
const Discord = require('discord.js');
const config = require('../../media/config.json');
const statusWebhookClient = new Discord.WebhookClient(config.statusLog.id, config.statusLog.token);
const errorWebhookClient = new Discord.WebhookClient(config.errorLog.id, config.errorLog.token);
const fs = require('fs');

const statusUpdate  = (embed) => {
	if (!(process.argv[2] && process.argv[2] === 'test')) statusWebhookClient.send({ embeds: [ embed ] }).catch(console.error);
};

const errorLog = (error, stack, code) => {
	if (!(process.argv[2] && process.argv[2] === 'test')) errorWebhookClient.send({ embeds: [ { title: error, description: stack, footer: { text: `Code ${code}` }, timestamp: new Date().toISOString(), color: 0xff0000 } ] }).catch(console.error);
};

exports.load = client => {
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

	client.on('error', err => {
		console.error('Client error\n', err.stack);
		errorLog('Discord.JS Client Error', err.stack, err.code);
	});

	client.on('reconnecting', () => {
		statusUpdate({
			title: 'Reconnecting',
			timestamp: new Date().toISOString(),
			color: 0xfff53a
		});
	});

	client.on('resume', num => {
		statusUpdate({
			title: 'Resumed',
			description: `${num} events replayed.`,
			timestamp: new Date().toISOString(),
			color: 0x39ffb0
		})
	});

	process.on('unhandledPromiseRejection', err => {
		errorLog('Unhandled Promise Rejection', err.stack, err.code);
	});

	process.on('unhandledRejection', err => {
		errorLog('Unhandled Rejection Error', err.stack, err.code);
	});
};

exports.statusUpdate = statusUpdate;
