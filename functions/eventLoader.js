const Discord = require('discord.js');
const config = require('../../media/config.json');
const statusWebhookClient = new Discord.WebhookClient(config.statusLog.id, config.statusLog.token);
const errorWebhookClient = new Discord.WebhookClient(config.errorLog.id, config.errorLog.token);
const fs = require('fs');

let lastHeartbeat = Date.now();

function statusUpdate (embed, restart, client) {
	if (!(process.argv[2] && process.argv[2] === 'test')) statusWebhookClient.send({ embeds: [ embed ] }).then(() => {
		if (restart) setTimeout(() => {
			if (Date.now() - lastHeartbeat > 45000 || (client && client.ws.lastHeartbeatAck === false)) process.exit(0);
			else statusUpdate({
				title: 'Reconnected',
				timestamp: new Date().toISOString(),
				color: 0xb25bff
			});
		}, 60000);
	}).catch(console.error);
}

const errorLog = (error, stack, code) => {
	if (!(process.argv[2] && process.argv[2] === 'test')) errorWebhookClient.send({ embeds: [ { title: error, description: stack, footer: { text: `Code ${code}` }, timestamp: new Date().toISOString(), color: 0xff0000 } ] }).catch(console.error);
};

const rawEvents = {
	MESSAGE_REACTION_ADD: 'messageReactionAdd',
	MSESAGE_REACTION_REMOVE: 'messageReactionRemove'
};

exports.load = client => {
	let start = Date.now();
	let events = fs.readdirSync('./events');
	console.log(`Loading ${events.length} events..`);

	events.forEach(file => {
		console.log(`Loading ${file}..`);
		let eventName = file.split('.')[0];
		let event = require(`../events/${file}`);

		client.on(eventName, event.bind(null, client));
		console.log('Loaded.');
	});

	console.log(`Loaded ${events.length} events in ${Date.now() - start} ms.\n`);
	
	client.on('raw', async event => {
		if (!rawEvents.hasOwnProperty(event.t)) return;
		
		const { d: data } = event;
		const user = client.users.get(data.user_id); // or client.fetchUser when fetchAllMembers is off
		const channel = client.channels.get(data.channel_id); // || await user.createDM(); if using DM reactions
		
		if (!channel || channel.messages.has(data.message_id)) return;
		
		const message = await channel.fetchMessage(data.message_id);
		if (!message) return;

		const emojiKey = (data.emoji.id) ? `${data.emoji.name}:${data.emoji.id}` : data.emoji.name;
		const reaction = message.reactions.get(emojiKey);

		client.emit(rawEvents[event.t], reaction, user);
	});

	client.on('debug', d => {
		if (d.includes('Session invalidated')) statusUpdate({
			title: 'Session Invalidated',
			timestamp: new Date().toISOString(),
			color: 0xf47742,
		}, true);
		
		if (d.includes('eartbeat')) lastHeartbeat = Date.now();
		else console.log(d);
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
		});
	});

	process.on('unhandledPromiseRejection', err => {
		errorLog('Unhandled Promise Rejection', err.stack, err.code);
	});

	process.on('unhandledRejection', err => {
		errorLog('Unhandled Rejection Error', err.stack, err.code);
	});
};

exports.statusUpdate = statusUpdate;
