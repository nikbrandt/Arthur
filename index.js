const fs = require('fs');

const sqlog = fs.createWriteStream('../media/sql.log');

const sqlite = require('sqlite');
const sqlite3 = require('sqlite3');
let sql;

exports.broadcastEval = broadcastEval; // such that the post() function below has it defined

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

sqlite.open({
	filename: '../media/db.sqlite',
	driver: sqlite3.cached.Database
}).then(db => {
	sql = db;

	manager.spawn().catch(console.error);
}).catch(console.error);

let stopwatchUserObject = {};

let commandStatsObject = JSON.parse(fs.readFileSync('../media/stats/commands.json'));
let dailyStatsObject = JSON.parse(fs.readFileSync('../media/stats/daily.json'));
let weeklyStatsObject = JSON.parse(fs.readFileSync('../media/stats/weekly.json'));

let queue = new Map();
let queueID = 0;

manager.on('shardCreate', shard => {
	console.log(`Launched shard ${shard.id}`);
	
	shard.on('ready', () => {
		shard.send({
			uptime: Date.now() - Math.floor(process.uptime() * 1000),
			id: shard.id
		}).catch(console.error);
	});
	
	shard.on('message', message => {
		if (message.sql) {
			let timeline = { start: Date.now() };
			let { id, query, args } = message;

			sql[message.sql](query, args).then(result => {
				timeline.sqlFinished = Date.now() - timeline.start;
				sqlThen(shard, id, result, timeline);
			}).catch(error => {
				timeline.sqlFinished = Date.now() - timeline.start;
				timeline.error = true;
				sqlCatch(shard, id, error, timeline);
			});
			
			return;
		}
		
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
		
		if (message.broadcastEval) {
			let { script, id } = message.broadcastEval;
			let internalID = queueID++;
			
			queue.set(internalID, {
				shards: 0,
				returnShard: shard,
				returnID: id,
				results: {}
			});
			
			manager.shards.forEach(shard => {
				shard.send({
					eval: {
						script: script,
						id: internalID
					}
				});
			});
			
			return;
		}
		
		if (message.eval) {
			let { error, result, id } = message.eval;
			
			if (!queue.has(id)) return;
			let queueObj = queue.get(id);
			
			if (error) {
				queue.delete(id);
				
				if (queueObj.internal) return queueObj.internal.reject(error);
				
				return queueObj.returnShard.send({
					broadcastEval: {
						error: error,
						id: queueObj.returnID
					}
				}).catch(console.error);
			}
			
			queueObj.shards++;
			queueObj.results[shard.id] = result;
			
			if (queueObj.shards < manager.shards.size) return;
			
			let results = [];
			for (let i = 0; i < queueObj.shards; i++) {
				results.push(queueObj.results[i]);
			}
			
			if (queueObj.internal) queueObj.internal.resolve(results);
			else queueObj.returnShard.send({
				broadcastEval: {
					result: results,
					id: queueObj.returnID
				}
			}).catch(console.error);
			
			queue.delete(id);
			
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
		
		if (message.restart) process.exit();
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

function sqlThen(shard, id, result, timeline) {
	shard.send({
		sql: {
			id: id,
			result: result
		}
	}).catch(console.error).then(() => {
		handleSQLTimeline(timeline);
	});
}

function sqlCatch(shard, id, error, timeline) {
	console.error('SQL Error:');
	console.error(error);

	shard.send({
		sql: {
			id: id,
			error: error
		}
	}).catch(console.error).then(() => {
		handleSQLTimeline(timeline);
	});
}

function handleSQLTimeline(timeline) {
	timeline.finished = Date.now() - timeline.start;
	
	sqlog.write(`SQL rec at ${timeline.start}, finished ${timeline.sqlFinished} ms later, sent off ${timeline.finished - timeline.sqlFinished} ms later, total ${timeline.finished} ms.\n`);
}


function broadcastEval(script) {
	return new Promise((resolve, reject) => {
		let id = queueID++;
		
		queue.set(id, {
			shards: 0,
			results: {},
			internal: { resolve, reject }
		});
		
		manager.shards.forEach(shard => {
			shard.send({
				eval: { script, id}
			}).catch(reject);
		});
	});
}

setInterval(() => {
	fs.writeFileSync('../media/stats/commands.json', JSON.stringify(commandStatsObject));
	fs.writeFileSync('../media/stats/daily.json', JSON.stringify(dailyStatsObject));
	fs.writeFileSync('../media/stats/weekly.json', JSON.stringify(weeklyStatsObject));
}, 30000);

if (!test) setInterval(() => {
	post().catch(console.error);
}, 1000 * 60 * 2);