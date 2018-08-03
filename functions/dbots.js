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
		uri: `https://bots.discord.pw/api/bots/${client.user.id}/stats`,
		method: 'POST',
		json: true,
		headers: {
			"Authorization": client.config.dbotsAuth.pw
		},
		body: {
			"server_count": client.guilds.size
		}
	};
	
	let listcordOpts = {
		uri: `https://listcord.com/api/bot/${client.user.id}/guilds`,
		method: 'POST',
		json: true,
		headers: {
			"Authorization": client.config.dbotsAuth.listcord
		},
		body: {
			"guilds": client.guilds.size
		}
	};

	request(orgOpts);
	request(pwOpts);
	request(listcordOpts);
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