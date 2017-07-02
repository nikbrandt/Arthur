const Discord = require('discord.js');
const client = new Discord.Client();

client.config = require('../media/config.json');
client.commands = new Discord.Collection();
client.aliases = new Discord.Collection();

require('./util/commandLoader.js')(client);
require('./util/eventLoader.js')(client);
require('./util/functions.js')(client);


client.login(client.config.token);