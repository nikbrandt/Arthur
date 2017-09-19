const request = require('request');

exports.post = client => {
	let orgOpts = {
		url: `https://discordbots.org/api/bots/${client.user.id}/stats`,
		method: 'POST',
		json: true,
		headers: {
			"Authorization": client.config.dbotsAuth.org
		},
		body: {
			"server_count": client.guilds.size
		}
	};

	let pwOpts = {
		uri: `https://bots.discord.pw/api/bots/${client.user.id}/stats`,
		method: 'POST',
		json: true,
		headers: {
			"Authorization": client.config.dbotsAuth.pw.bot
		},
		body: {
			"server_count": client.guilds.size
		}
	};

	request(orgOpts);
	request(pwOpts);
};

exports.getLikes = client => {
	let opts = {
		uri: `https://discordbots.org/api/bots/329085343800229889/votes?onlyids=1`,
		method: 'GET',
		json: true,
		headers: {
			"Authorization": client.config.dbotsAuth.pw.bot
		}
	};

	request(opts, (err, response, body) => {
		client.dbotsUpvotes = body;
	})
};