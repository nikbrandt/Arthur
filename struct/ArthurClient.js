const { Client, Collection } = require('discord.js');

class ArthurClient extends Client {
	constructor (options) {
		super(options);
		
		this.loadStart = Date.now();
		
		this.test = !!(process.argv[2] && process.argv[2] === 'test');
		this.processing = [];

		this.commandStatsObject = JSON.parse(fs.readFileSync('../../media/stats/commands.json'));
		this.dailyStatsObject = JSON.parse(fs.readFileSync('../../media/stats/daily.json'));
		this.weeklyStatsObject = JSON.parse(fs.readFileSync('../../media/stats/weekly.json'));

		this.config = require('../../media/config.json');
		this.commands = new Collection();
		this.aliases = new Collection();
		this.reactionCollectors = new Collection();
	}
}

module.exports = ArthurClient;