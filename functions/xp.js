const PersistentCollection = require('djs-collection-persistent');
let defaultXP = {global: 0};

const noTable = (table, member, needToSet) => {
	defaultXP[member.guild.id] = {
		id: member.id,
		currentXP: 0,
		totalXP: 0,
		level: 0,
		xpMult: 1,
		lastXP: Date.now(),
		lastMsg: Date.now()
	};
	defaultXP.id = member.user.id;
	table = defaultXP;
	needToSet = true;
	return table;
};

const emojiForNumber = num => {
	let emojiArray = ['👑', ':two:', ':three:', ':four:', ':five:'];
	if (num <= 5 && num >= 1) return emojiArray[num - 1];
	else return num + '.';
};

module.exports = client => {
	const xpTable = new PersistentCollection({name: 'xpTable'});

	client.resetXP = () => {
		xpTable.deleteAll();
		return 'rude.';
	};
	
	client.memberXP = member => {
		let needToSet = false;
		let table = xpTable.get(member.user.id);
		
		if (!table) table = noTable(table, member, needToSet);
		if (!table[member.guild.id]) table[member.guild.id] = {
			id: member.id,
			currentXP: 0,
			totalXP: 0,
			level: 0,
			xpMult: 1,
			lastXP: Date.now(),
			lastMsg: Date.now()
		};
		xpTable.set(member.user.id, table);
		
		return table;
	};
	
	client.addXP = (message, member) => {
		if (message.channel.type != 'text') return;
		if (message.channel.id == '304429222477299712') return;
		if (!client.guildTable.has(member.guild.id) || client.guildTable.get(member.guild.id).levels === false) return;
		
		let table = xpTable.get(member.user.id);
		
		if (!table) table = noTable(table, member);
		if (!table[member.guild.id]) table[member.guild.id] = {
			id: member.id,
			currentXP: 0,
			totalXP: 0,
			level: 0,
			xpMult: 1,
			lastXP: Date.now(),
			lastMsg: Date.now()
		};
			
		let gTable = table[member.guild.id];
		
		if (Date.now() - gTable.lastXP < client.config.xp.xpAdd) {
			gTable.lastMsg = Date.now();
			table[member.guild.id] = gTable;
			return xpTable.set(member.user.id, table);
		}
		
		let xpM = 1;
		if (Date.now() - gTable.lastMsg < 15000) xpM = gTable.xpMult * 1.03;
		else if (Date.now() - gTable.lastMsg < 30000) xpM = gTable.xpMult * 1.015;
		else if (Date.now() - gTable.lastMsg < 60000) xpM = gTable.xpMult * 1.0075;
		if (xpM > client.config.xp.maxMult) xpM = client.config.xp.maxMult;
		gTable.xpMult = xpM;
		
		const xpBase = Math.round(xpM * client.config.xp.base);
		const xpMin = xpBase - client.config.xp.min;
		const xpMax = xpBase + client.config.xp.max;
		const xpAdd = Math.round(Math.random() * (xpMax - xpMin) + xpMin);
		
		let levelsArray = [];
		let temp = 0;
		let xpLevel = 0;
		for (let i = 0; i < 101; i++) {
			temp += Math.round(client.config.xp.levelOne * Math.pow(client.config.xp.eqMult, i));
			levelsArray.push(temp);
			if (temp < gTable.totalXP) xpLevel = i + 1;
		}
		
		if (gTable.totalXP + xpAdd >= levelsArray[xpLevel] && xpLevel + 1 !== gTable.level) {
			gTable.level = xpLevel + 1;
			gTable.currentXP = gTable.totalXP + xpAdd - levelsArray[xpLevel];
			message.channel.send(`Nice job, ${member}, you've achieved level **${xpLevel + 1}**`);
		} else gTable.currentXP += xpAdd;
		
		table.global += xpAdd;
		gTable.totalXP += xpAdd;
		gTable.lastXP = Date.now();
		gTable.lastMsg = Date.now();
		
		table[member.guild.id] = gTable;
		xpTable.set(member.user.id, table);
	};
	
	client.checkGlobalRank = id => {
		let list = xpTable.array().sort((a, b) => {
			return JSON.parse(a).global < JSON.parse(b).global ? 1 : -1;
		});
		
		let index = list.findIndex(x => JSON.parse(x).id === id);
		if (typeof(index) !== 'number') return false;
		
		return {
			rank: index + 1,
			page: Math.ceil((index + 1) / 5)
		};
	};
	
	client.checkGuildRank = (guildID, id) => {
		let list = xpTable.filter(x => JSON.parse(x)[guildID] !== undefined).array().sort((a, b) => {
			return JSON.parse(a)[guildID].totalXP < JSON.parse(b)[guildID].totalXP ? 1 : -1;
		});
		
		let index = list.findIndex(x => JSON.parse(x).id === id);
		if (typeof(index) !== 'number') return false;
		
		return {
			rank: index + 1,
			page: Math.ceil((index + 1) / 5)
		};
	};
	
	client.guildLeaderboard = (guildID, page) => {
		let entries = xpTable.filter(x => JSON.parse(x)[guildID] !== undefined).array().sort((a, b) => {
			return JSON.parse(a)[guildID].totalXP < JSON.parse(b)[guildID].totalXP ? 1 : -1;
		});
		
		let maxPage = Math.ceil(entries.length / 5);
		if (page > maxPage) return false;
		if (!JSON.parse(entries[0])[guildID]) return {
			max: 1,
			array: ['No one in this server has talked yet..']
		};
		
		let pageArray = [];
		entries.slice(page * 5 - 5, page * 5 - 1);
		let startNum = page * 5 - 4;
		let guild = client.guilds.get(guildID);
		
		entries.forEach(strEntry => {
			let entry = JSON.parse(strEntry)[guildID];
			pageArray.push(`${emojiForNumber(startNum)} ${startNum === 1 ? '**' : ''} ${guild.members.get(entry.id).displayName} | Level ${entry.level} | ${entry.totalXP} xp${startNum === 1 ? '**' : ''}`);
			startNum++;
		});
		
		return {
			max: maxPage,
			array: pageArray,
		};
	};
	
	client.globalLeaderboard = page => {
		let entries = xpTable.array().sort((a, b) => {
			return JSON.parse(a).global < JSON.parse(b).global ? 1 : -1;
		});
		
		let maxPage = Math.ceil(entries.length / 5);
		if (page > maxPage) return false;
		if (!JSON.parse(entries[0]).global) return {
			max: 1,
			array: ['No one has talked or has levels enabled for this bot.']
		};
		
		let pageArray = [];
		entries.slice(page * 5 - 5, page * 5 - 1);
		let startNum = page * 5 - 4;
		
		entries.forEach(strEntry => {
			let entry = JSON.parse(strEntry);
			pageArray.push(`${emojiForNumber(startNum)} ${startNum === 1 ? '**' : ''} ${client.users.get(entry.id).username} | ${entry.global} XP${startNum === 1 ? '**' : ''}`);
			startNum++;
		});
		
		return {
			max: maxPage,
			array: pageArray
		}
	};
};