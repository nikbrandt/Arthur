const request = require('request');

exports.post = client => {
	let orgOpts = {
		url: `https://discordbots.org/api/bots/${client.user.id}/stats`,
		method: 'POST',
		json: true,
		headers: {
			"Authorization": client.config.dbotsAuth.org.bot
		},
		body: {
			"server_count": client.guilds.size
		}
	};

	let pwOpts = {
		uri: `https://discord.bots.gg/api/v1/bots/${client.user.id}/stats`,
		method: 'POST',
		json: true,
		headers: {
			"Authorization": client.config.dbotsAuth.pw
		},
		body: {
			"guildCount": client.guilds.size
		}
	};

	try {
		request(orgOpts);
		request(pwOpts);
	} catch (e) {}
};

exports.getLikes = client => {
	let opts = {
		uri: `https://discordbots.org/api/bots/329085343800229889/votes?onlyids=1`,
		method: 'GET',
		json: true,
		headers: {
			"Authorization": client.config.dbotsAuth.org.bot
		}
	};

	request(opts, (err, response, body) => {
		client.dbotsUpvotes = body;
	})
};
