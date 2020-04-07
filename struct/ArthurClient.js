const { Client, Collection } = require('discord.js');
const loadCommands = require('../functions/commandLoader');
const eventLoader = require('../functions/eventLoader');
const permLevel = require('../functions/permLevel.js');
const findMember = require('../functions/findMember.js');
const i18n = require('../struct/i18n');

class ArthurClient extends Client {
	constructor (options) {
		super(options);
		
		this.loadStart = Date.now();
		
		this.test = !!(process.argv[2] && process.argv[2] === 'test');
		this.processing = [];

		this.commandStatsObject = {};
		this.dailyStatsObject = {};
		this.weeklyStatsObject = {};

		this.config = require(`${__basedir}/../media/config.json`);
		this.commands = new Collection();
		this.aliases = new Collection();
		this.reactionCollectors = new Collection();
		this.shardQueue = new Map();

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
		
		this.login(this.test ? this.config.testToken : this.config.token).catch(console.error);
	}
}

module.exports = ArthurClient;