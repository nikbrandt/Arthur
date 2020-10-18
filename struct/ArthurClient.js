const { Client, Collection } = require('discord.js');
const loadCommands = require('../functions/commandLoader');
const eventLoader = require('../functions/eventLoader');
const permLevel = require('../functions/permLevel.js');
const findMember = require('../functions/findMember.js');
const i18n = require('../struct/i18n');
const config = require('../../media/config.json');

class ArthurClient extends Client {
	constructor (options) {
		super(options);
		
		this.loadStart = Date.now();
		this.queueCount = 0;
		
		this.test = !!(process.argv[2] && process.argv[2] === 'test');
		this.processing = [];

		this.commandStatsObject = {};
		this.dailyStatsObject = {};
		this.weeklyStatsObject = {};

		this.config = config;
		this.ownerID = config.owners[0];
		this.commands = new Collection();
		this.aliases = new Collection();
		this.reactionCollectors = new Collection();
		this.shardQueue = new Map();
		this.shardErrorQueue = new Map();
		this.guildBlacklists = new Map();
		this.hardBlacklist;

		loadCommands(this);

		this.i18n = new i18n(this);
		global.i18n = this.i18n;
		
		permLevel.pl(this);
		this.findMember = findMember;
	}
	
	async init () {
		eventLoader.load(this);
		await this.i18n.init();
		this.totalXP = (await sql.get('SELECT SUM(global) FROM (SELECT DISTINCT userID, global FROM xp)'))['SUM(global)'];
		
		this.login(this.test ? this.config.testToken : this.config.token).catch(this.errorLog.simple);
	}
	
	broadcastEval(script) {
		return new Promise((resolve, reject) => {
			if (!this.readyTimestamp) reject('Client not ready yet.');
			
			let id = this.queueCount++;
			
			this.shardQueue.set(id, resolve);
			this.shardErrorQueue.set(id, reject);
			
			this.shard.send({
				action: 'broadcastEval',
				script: script,
				id: id
			}).catch(reject);
		});
	}

	async getGuildBlacklist(guildID) {
		if (this.guildBlacklists.has(guildID)) return this.guildBlacklists.get(guildID);
		else {
			let blacklist = await sql.all('SELECT ID FROM guildBlacklist WHERE guildID = ?', guildID);
			this.guildBlacklists.set(guildID, blacklist.map(o => o.ID));

			return blacklist;
		}
	}

	async checkHardBlacklist(id) {
		if (this.hardBlacklist) return this.hardBlacklist.includes(id);
		else {
			let blacklist = await sql.all('SELECT id FROM hardBlacklist');
			blacklist = blacklist.map(o => o.id);
			this.hardBlacklist = blacklist;

			return blacklist.includes(id);
		}
	}
}

module.exports = ArthurClient;