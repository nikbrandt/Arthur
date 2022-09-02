const Discord = require('discord.js');
const config = require('../../media/config.json');
const statusWebhookClient = new Discord.WebhookClient({ id: config.statusLog.id, token: config.statusLog.token});
const errorWebhookClient = new Discord.WebhookClient({ id: config.errorLog.id, token: config.errorLog.token });
const fs = require('fs');

let lastHeartbeat = Date.now();

function statusUpdate (embed) {
	if (!(process.argv[2] && process.argv[2] === 'test')) statusWebhookClient.send({ embeds: [ embed ] }).catch(() => {});
}

const errorLog = (shortError, error, noConsole) => {
	if (!noConsole) {
		console.error(shortError);
		console.error(error.stack ? error.stack : error);
	}

	let { stack, code} = error;
	if (!stack) stack = error;

	if (process.argv[2] && process.argv[2] === 'test') {
		if (process.env['ARTHUR_ERRORLOG'] !== 'true') return;
		code += ' | Testbot error';
	}

	errorWebhookClient.send({
		embeds: [ {
			title: shortError,
			description: '```js\n' + stack + '```',
			footer: {
				text: code + ` | Shard ${errorLog.shardID}` + (errorLog.lastCommand ? ` | last command: ${errorLog.lastCommand}` : '')
			},
			timestamp: new Date().toISOString(),
			color: 0xff0000
		} ]
	}).catch((e) => {
		console.error('Error sending error webhook:\n', e.stack);
	});
};

errorLog.simple = error => {
	errorLog(`Simple error log error`, error);
};

const rawEvents = {
	MESSAGE_REACTION_ADD: 'messageReactionAdd',
	MESSAGE_REACTION_REMOVE: 'messageReactionRemove'
};

exports.load = client => {
	let start = Date.now();
	let events = fs.readdirSync('./events');
	console.log(`Loading ${events.length} events..`);
	process.stdout.write('   ');

	client.errorLog = errorLog;

	events.forEach(file => {
		let eventName = file.split('.')[0];
		let event = require(`../events/${file}`);

		client.on(eventName, event.bind(null, client));
		process.stdout.write(`${file.slice(0, -3)} `);
	});

	console.log();
	console.log(`Loaded ${events.length} events in ${Date.now() - start} ms.\n`);

	client.on('raw', async event => {
		if (!rawEvents.hasOwnProperty(event.t)) return;

		const { d: data } = event;
		const user = await client.users.fetch(data.user_id);
		const channel = client.channels.cache.get(data.channel_id); // || await user.createDM(); if using DM reactions

		if (!channel || channel.messages.cache.has(data.message_id)) return;

		const message = await channel.messages.fetch(data.message_id).catch(() => {});
		if (!message) return;

		const emojiKey = (data.emoji.id) ? `${data.emoji.name}:${data.emoji.id}` : data.emoji.name;
		const reaction = message.reactions.cache.get(emojiKey) ? await message.reactions.cache.get(emojiKey).fetch() : undefined;

		if (!reaction || !reaction.message) return;

		client.emit(rawEvents[event.t], reaction, user);
	});

	client.on('debug', d => {
		if (d.startsWith('[VOICE')) return;

		if (d.includes('Session invalidated')) statusUpdate({
			title: 'Session Invalidated',
			timestamp: new Date().toISOString(),
			color: 0xf47742,
		});

		if (d.includes('eartbeat')) {
			lastHeartbeat = Date.now();
			return;
		}

		console.log(d);
	});

	client.on('error', err => {
		errorLog('Discord.JS Client Error', err);
	});

	process.on('unhandledPromiseRejection', (err, promise) => {
		errorLog(`Unhandled Promise Rejection at ${promise}`, err);
	});

	process.on('unhandledRejection', (err, promise) => {
		if (err.code === 'ERR_IPC_CHANNEL_CLOSED') process.exit();
		errorLog(`Unhandled Rejection Error at ${promise}`, err);
	});

	process.on('uncaughtException', err => {
		console.error(err);
		fs.writeFileSync(__basedir + '/../media/temp/crash.txt', err.code + '\n' + err.stack);
		process.exit(err.code);
	});
};

exports.statusUpdate = statusUpdate;
exports.errorLog = errorLog;
