const sql = require('sqlite');
const ArthurClient = require('./struct/ArthurClient');

global.__basedir = __dirname;

const client = new ArthurClient({
    fetchAllMembers: true,
    disabledEvents: ['TYPING_START'],
	disableEveryone: true
});

sql.open('../media/db.sqlite').catch(console.error);

client.init();