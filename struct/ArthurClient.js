const { Client, Collection } = require('discord.js');
const loadCommands = require('../functions/commandLoader');
const eventLoader = require('../functions/eventLoader');
const permLevel = require('../functions/permLevel.js');
const findMember = require('../functions/findMember.js');
const i18n = require('../struct/i18n');
const fs = require('fs');

class ArthurClient extends Client {
	constructor (options) {
		super(options);
		
		this.loadStart = Date.now();
		
		this.test = !!(process.argv[2] && process.argv[2] === 'test');
		this.processing = [];

		this.commandStatsObject = JSON.parse(fs.readFileSync(`${__basedir}/../media/stats/commands.json`));
		this.dailyStatsObject = JSON.parse(fs.readFileSync(`${__basedir}/../media/stats/daily.json`));
		this.weeklyStatsObject = JSON.parse(fs.readFileSync(`${__basedir}/../media/stats/weekly.json`));

		this.config = require(`${__basedir}/../media/config.json`);
		this.commands = new Collection();
		this.aliases = new Collection();
		this.reactionCollectors = new Collection();
		this.i18n = new i18n();
		
		permLevel.pl(this);
		findMember(this);
	}
	
	init () {
		loadCommands(this);
		eventLoader.load(this);
		
		this.login(this.test ? this.config.testToken : this.config.token).catch(console.error);
	}
}

module.exports = ArthurClient;