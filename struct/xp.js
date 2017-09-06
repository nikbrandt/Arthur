const sql = require('sqlite');
const config = require('../../media/config.json');

const emojiForNumber = num => {
	let emojiArray = ['👑', ':two:', ':three:', ':four:', ':five:'];
	if (num <= 5 && num >= 1) return emojiArray[num - 1];
	else return num + '.';
};

class XP {
	static async memberXP (member) {
		let row = await sql.get(`SELECT * FROM xp WHERE userID = ${member.user.id} AND guildID = ${member.guild.id}`);
		if (!row) {
			sql.run(`INSERT INTO xp (userID, guildID, current, total, level, mult, global, lastXP) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [member.user.id, member.guild.id, 0, 0, 0, 1, 0, 0]);
			return {
				current: 0,
				total: 0,
				level: 0,
				mult: 0
			}
		}
		return {
			current: row.current,
			total: row.total,
			level: row.level,
			mult: row.mult,
			global: row.global
		}
	}

	static async addXP (message, guildRow) {
		if (message.channel.type !== 'text') return;
		if (message.channel.id === '304429222477299712') return;

		if (!guildRow || guildRow.levels === 'false') return;

		let rows = await sql.all(`SELECT * FROM xp WHERE userID = '${message.author.id}'`);
		let global = Math.max.apply(Math, rows.map(a => a.global));

		let row = await sql.get(`SELECT * FROM xp WHERE userID = '${message.author.id}' AND guildID = '${message.guild.id}'`);
		if (!row) return sql.run(`INSERT INTO xp (userID, guildID, current, total, level, mult, global, lastXP, lastMessage) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [message.author.id, message.guild.id, 0, 0, 0, 1, 0, 0, Date.now()]);

		if (Date.now() - row.lastXP < config.xp.xpAdd) return sql.run(`UPDATE xp SET lastMessage = ${Date.now()} WHERE userID = '${message.author.id}' AND guildID = '${message.guild.id}'`);

		let mult;
		if (Date.now() - row.lastMessage < 10000) mult = row.mult * 1.02;
		else if (Date.now() - row.lastMessage < 25000) mult = row.mult * 1.01;
		else if (Date.now() - row.lastMessage < 50000) mult = row.mult * 1.005;
		else mult = 1;
		if (mult > config.xp.maxMult) mult = config.xp.maxMult;
		sql.run(`UPDATE xp SET mult = ${mult} WHERE userID = '${message.author.id}' AND guildID = '${message.guild.id}'`);

		let base = Math.round(mult * config.xp.base);
		let min = base - config.xp.min;
		let max = base + config.xp.max;
		let add = Math.round(Math.random() * (max - min) + min);
		let levels = [];
		let level = 0;
		let temp = 0;

		for (let i = 0; i < 101; i++) {
			temp += Math.round(config.xp.levelOne * Math.pow(config.xp.mult, i));
			levels.push(temp);
			if (temp < row.total) level = i + 1;
		}

		if (row.total + add >= levels[level] && level + 1 > row.level) {
			sql.run(`UPDATE xp SET level = ${level + 1} WHERE guildID = '${message.guild.id}' AND userID = '${message.author.id}'`);
			sql.run(`UPDATE xp SET current = ${row.total + add - levels[level]} WHERE userID = '${message.author.id}' AND guildID = '${message.guild.id}'`);
			message.channel.send(`Nice job, ${message.author.toString()}, you've achieved level **${level + 1}**!`);
		} else sql.run(`UPDATE xp SET current = ${row.current + add} WHERE userID = '${message.author.id}' AND guildID = '${message.guild.id}'`);

		sql.run(`UPDATE xp SET total = ${row.total + add} WHERE userID = '${message.author.id}' AND guildID = '${message.guild.id}'`);
		sql.run(`UPDATE xp SET lastXP = ${Date.now()} WHERE userID = '${message.author.id}' AND guildID = '${message.guild.id}'`);
		sql.run(`UPDATE xp SET lastMessage = ${Date.now()} WHERE userID = '${message.author.id}' AND guildID = '${message.guild.id}'`);
		sql.run(`UPDATE xp SET global = ${global + add} WHERE userID = '${message.author.id}'`);
	}

	static async globalRank (user) {
		let rows = await sql.all('SELECT DISTINCT userID, global FROM xp');
		rows = rows.sort((a, b) => {
			return a.global < b.global ? 1 : -1;
		});

		let index = rows.findIndex(x => x.userID === user.id);
		if (typeof index !== 'number') return false;

		return {
			rank: index + 1,
			page: Math.ceil((index + 1) / 5)
		};
	}

	static async guildRank (member) {
		let rows = await sql.all(`SELECT userID, total FROM xp WHERE guildID = '${member.guild.id}'`);
		rows = rows.sort((a, b) => {
			return a.total < b.total ? 1 : -1;
		});

		let index = rows.findIndex(x => x.userID === member.user.id);
		if (typeof index !== 'number') return false;

		return {
			rank: index + 1,
			page: Math.ceil((index + 1) / 5)
		};
	}

	static async guildLeaderboard (guildID, page, client) {
		let entries = await sql.all(`SELECT userID, level, total FROM xp WHERE guildID = '${guildID}'`);

		if (!entries) return {
			max: 1,
			array: ['No one in this server has talked yet.']
		};

		entries = entries.sort((a, b) => {
			return a.total < b.total ? 1 : -1;
		});

		let maxPage = Math.ceil(entries.length / 5);
		if (page > maxPage) return false;

		let pageArray = [];
		entries = entries.slice(page * 5 - 5, page * 5);
		let startNum = page * 5 - 4;

		for (let entry of entries) {
			let user = await client.fetchUser(entry.userID);
			pageArray.push(`${emojiForNumber(startNum)} ${startNum === 1 ? '**' : ''} ${user.username} | Level ${entry.level} | ${entry.total} xp${startNum === 1 ? '**' : ''}`);
			startNum++;
		}

		return {
			max: maxPage,
			array: pageArray
		};
	}

	static async globalLeaderboard (page, client) {
		let entries = await sql.all(`SELECT DISTINCT userID, global FROM xp`);

		if (!entries) return {
			max: 1,
			array: ['No one, across the entire bot, has ever talked.. how sad.']
		};

		entries = entries.sort((a, b) => {
			return a.global < b.global ? 1 : -1;
		});

		let maxPage = Math.ceil(entries.length / 5);
		if (page > maxPage) return false;

		let pageArray = [];
		entries = entries.slice(page * 5 - 5, page * 5);
		let startNum = page * 5 - 4;

		for (let entry of entries) {
			let user = await client.fetchUser(entry.userID);
			pageArray.push(`${emojiForNumber(startNum)} ${startNum === 1 ? '**' : ''} ${user.username} | ${entry.global} xp${startNum === 1 ? '**' : ''}`);
			startNum++;
		}

		return {
			max: maxPage,
			array: pageArray
		};
	}
}

module.exports = XP;