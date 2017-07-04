const Discord = require('discord.js');
const client = new Discord.Client({
    fetchAllMembers: true,
    disabledEvents: ['TYPING_START']
});
const PersistentCollection = require('djs-collection-persistent');

client.config = require('../media/config.json');
client.commands = new Discord.Collection();
client.aliases = new Discord.Collection();
client.guildTable = new PersistentCollection({name: 'guildOptions'});

require('./util/commandLoader.js')(client);
require('./util/eventLoader.js')(client);
require('./functions/permLevel.js')(client);
require('./functions/xp.js')(client);
require('./functions/findMember.js')(client);

client.login(client.config.token);