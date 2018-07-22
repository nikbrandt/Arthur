const fs = require('fs');
const sql = require('sqlite');
const Discord = require('discord.js');

global.__basedir = __dirname;
let loadStart = Date.now();

const client = new Discord.Client({
    fetchAllMembers: true,
    disabledEvents: ['TYPING_START'],
	disableEveryone: true
});

client.tempStopwatch = stopwatch;

client.test = !!(process.argv[2] && process.argv[2] === 'test');
client.processing = [];
client.dbotsUpvotes = [];

client.commandStatsObject = JSON.parse(fs.readFileSync('../media/stats/commands.json'));
client.dailyStatsObject = JSON.parse(fs.readFileSync('../media/stats/daily.json'));
client.weeklyStatsObject = JSON.parse(fs.readFileSync('../media/stats/weekly.json'));

client.config = require('../media/config.json');
client.commands = new Discord.Collection();
client.aliases = new Discord.Collection();
client.reactionCollectors = new Discord.Collection();

sql.open('../media/db.sqlite').catch(console.error);

require('./functions/commandLoader.js')(client);
require('./functions/eventLoader.js').load(client);
require('./functions/permLevel.js').pl(client);
require('./functions/findMember.js')(client);

client.login(client.test ? client.config.testToken : client.config.token).catch(console.error);