const sql = require('sqlite');
const Discord = require('discord.js');
const client = new Discord.Client({
    fetchAllMembers: true,
    disabledEvents: ['TYPING_START']
});

client.config = require('../media/config.json');
client.commands = new Discord.Collection();
client.aliases = new Discord.Collection();

sql.open('../media/db.sqlite').catch(console.error);

require('./util/commandLoader.js')(client);
require('./util/eventLoader.js')(client);
require('./functions/permLevel.js').pl(client);
require('./functions/findMember.js')(client);

client.login(client.config.token).catch(console.error);