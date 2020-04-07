const fs = require('fs');

const config = require('../media/config');
const { post } = require('./functions/dbots');

const test = !!(process.argv[2] && process.argv[2] === 'test');

if (!test) {
	let tempItems = fs.readdirSync('../media/temp');
	if (tempItems) tempItems.forEach(i => {
		fs.unlinkSync(`../media/temp/${i}`);
	});
}

const { ShardingManager } = require('discord.js');
const manager = new ShardingManager('./bot.js', {
	token: test ? config.testToken : config.token,
	shardArgs: test ? [ 'test' ] : []
});

manager.spawn().catch(console.error);

let stopwatchUserObject = {};

let commandStatsObject = JSON.parse(fs.readFileSync('../media/stats/commands.json'));
let dailyStatsObject = JSON.parse(fs.readFileSync('../media/stats/daily.json'));
let weeklyStatsObject = JSON.parse(fs.readFileSync('../media/stats/weekly.json'));

manager.on('shardCreate', shard => {
	console.log(`Launched shard ${shard.id}`);
	
	shard.on('ready', () => {
		shard.send({
			uptime: Date.now() - Math.floor(process.uptime() * 1000),
			id: shard.id
		}).catch(console.error);
	});
	
	shard.on('message', message => {
		if (message.stopwatch) {
			let id = message.stopwatch;
			
			if (stopwatchUserObject[id]) {
				shard.send({ stopwatch: { id: id, start: stopwatchUserObject[id] }}).catch(() => {});
				delete stopwatchUserObject[id];
			} else {
				stopwatchUserObject[id] = Date.now();
				shard.send({ stopwatch: { id: id }}).catch(() => {});
			}
			
			return;
		}
		
		if (message.updateStats) {
			let stats = message.updateStats;
			
			addValues(stats.commands, commandStatsObject);
			addValues(stats.daily, dailyStatsObject);
			addValues(stats.weekly, weeklyStatsObject);
			
			return;
		}
		
		if (message.getStats) {
			switch(message.getStats) {
				case 'commands':
					shard.send({ id: message.id, stats: true, value: commandStatsObject });
					break;
				case 'daily':
					shard.send({ id: message.id, stats: true, value: dailyStatsObject[message.arg] });
					break;
				case 'weekly':
					shard.send({ id: message.id, stats: true, value: weeklyStatsObject[message.arg] });
					break;
			}
		}
	});
});

function addValues(from, to) {
	for (let key in from) {
		if (typeof from[key] !== 'number') {
			if (!to[key]) to[key] = {};
			addValues(from[key], to[key]);
		} else {
			if (!to[key]) to[key] = from[key];
			else to[key] += from[key];
		}
	}
}

setInterval(() => {
	fs.writeFileSync('../media/stats/commands.json', JSON.stringify(commandStatsObject));
	fs.writeFileSync('../media/stats/daily.json', JSON.stringify(dailyStatsObject));
	fs.writeFileSync('../media/stats/weekly.json', JSON.stringify(weeklyStatsObject));
}, 30000);

setInterval(() => {
	post(manager).catch(console.error);
}, 1000 * 60 * 2);