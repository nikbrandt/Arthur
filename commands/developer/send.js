const MESSAGE_CHANNEL_ID = '304441662724243457';

exports.run = async (message, args, suffix, client) => {
	if (!args[0]) return message.channel.send('Mhm. I\'ll send it to no one.');
	if (!args[1] && !message.attachments.size) return message.channel.send('Right. And what, exactly, are you sending?');
	if (!message.noDelete) message.delete().catch(() => {});

	let name;

	let channel = client.users.cache.get(Object.keys(client.recentMessages)[Object.values(client.recentMessages).indexOf(args[0])])
		||(await client.broadcastEval(`this.users.cache.get(Object.keys(this.recentMessages)[Object.values(this.recentMessages).indexOf('${args[0]}')])`)).filter(item => !!item)[0];

	if (!channel) channel = client.users.cache.get(args[0])
		|| (await client.broadcastEval(`this.users.cache.get('${args[0]}')`)).filter(item => !!item)[0];

	if (!channel) {
		channel = client.channels.cache.get(args[0])
			|| (await client.broadcastEval(`this.channels.cache.get('${args[0]}')`)).filter(item => !!item)[0];

		if (!channel) return message.channel.send('That\'s not a valid ID, sorry.');
		name = `${channel.name} in ${channel.guild.name}`
	} else name = channel.tag;

	let text = suffix.slice(args[0].length + 1);

	if (channel.client) {
		channel.send(suffix.slice(args[0].length + 1), { files: message.attachments.size ? [...message.attachments.values()].map(f => f.url) : [] }).then(() => {
			if (message.channel.id === MESSAGE_CHANNEL_ID) successMessage(client, message, name, text);
		}).catch(e => {
			if (message.channel.id === MESSAGE_CHANNEL_ID) failureMessage(client, name, text);
		});
	} else {
		let success = (await client.broadcastEval(`new Promise(resolve => {
			let channel = this.${name.includes('#') ? 'users' : 'channels'}.cache.get('${channel.id}');
			if (!channel) return resolve(null);
			channel.send("${suffix.slice(args[0].length + 1).replace(/"/g, '').replace(/\\/g, '\\\\')}").then(() => {
				resolve(true);
			}).catch(() => {
				resolve(false);
			});
		});`)).filter(item => item !== null)[0];

		if (message.channel.id !== MESSAGE_CHANNEL_ID) return;

		if (success === true) successMessage(client, message, name, text);
		else failureMessage(client, name, text);
	}
};

function successMessage(client, message, name, text) {
	finalMessage(client, {
		embeds: [{
			title: `Message to ${name}`,
			description: text,
			color: 0x00c140
		}],
		files: message.attachments.size ? [...message.attachments.values()].map(f => f.url) : []
	});
}

function failureMessage(client, name, text) {
	finalMessage(client, {
		embeds: [{
			title: `Message to ${name} failed to send`,
			description: text,
			color: 0xff0000
		}]
	})
}

function finalMessage(client, messageOptions) {
	if (client.channels.cache.has(MESSAGE_CHANNEL_ID)) return client.channels.cache.get(MESSAGE_CHANNEL_ID).send(messageOptions).catch(() => {});

	client.broadcastEval(`if (!this.channels.cache.has('${MESSAGE_CHANNEL_ID}') return;
	this.channels.cache.get('${MESSAGE_CHANNEL_ID}').send(${JSON.stringify(messageOptions)}).catch(() => {})`).catch(() => {});
}

exports.config = {
	enabled: true,
	permLevel: 9,
	category: 'developer'
};
