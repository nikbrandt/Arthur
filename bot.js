const sql = require('sqlite');
const ArthurClient = require('./struct/ArthurClient');

global.__basedir = __dirname;

const client = new ArthurClient({
    fetchAllMembers: true,
    disabledEvents: ['TYPING_START'],
	disableEveryone: true
});

sql.open('../media/db.sqlite').catch(console.error);

require('./functions/commandLoader.js')(client);
require('./functions/eventLoader.js').load(client);
require('./functions/permLevel.js').pl(client);
require('./functions/findMember.js')(client);

client.login(client.test ? client.config.testToken : client.config.token).catch(console.error);