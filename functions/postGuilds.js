const request = require('request');

module.exports = client => {
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
			"Authorization": client.config.dbotsAuth.pw
		},
		body: {
			"server_count": client.guilds.size
		}
	};

	request(orgOpts);
	request(pwOpts);
};