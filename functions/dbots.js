const request = require('request');

const config = require('../../media/config.json');
const { broadcastEval } = require.main.exports;

let guilds;
let prevShards;

exports.post = async () => {
	let shards = await broadcastEval('this.guilds.cache.size');

	let totalGuilds = shards.reduce((prev, cur) => prev + cur, 0);
	if (guilds === totalGuilds) return;
	guilds = totalGuilds;

	let orgOpts = {
		url: `https://top.gg/api/bots/${config.website.client_id}/stats`,
		method: 'POST',
		json: true,
		headers: {
			Authorization: config.dbotsAuth.org.bot
		},
		body: {
			shards: shards,
			shard_count: shards.length
		}
	};

	try {
		request(orgOpts);
	} catch (e) {}

	shards.forEach((shard, i) => {
		if (prevShards && prevShards[i] === shard) return;

		let pwOpts = {
			uri: `https://discord.bots.gg/api/v1/bots/${config.website.client_id}/stats`,
			method: 'POST',
			json: true,
			headers: {
				Authorization: config.dbotsAuth.pw
			},
			body: {
				guildCount: shard,
				shardCount: shards.length,
				shardId: i
			}
		};

		try {
			request(pwOpts);
		} catch (e) {}
	});

	prevShards = shards;
};

exports.getLikes = client => {
	let opts = {
		uri: `https://discordbots.org/api/bots/329085343800229889/votes?onlyids=1`,
		method: 'GET',
		json: true,
		headers: {
			Authorization: config.dbotsAuth.org.bot
		}
	};

	request(opts, (err, response, body) => {
		client.dbotsUpvotes = body;
	})
};
