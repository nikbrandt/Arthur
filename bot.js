process.env.BLUEBIRD_LONG_STACK_TRACES = 1; // best env variable practice right here
global.Promise = require('bluebird');

const sql = require('sqlite');
const ArthurClient = require('./struct/ArthurClient');

global.__basedir = __dirname;

const client = new ArthurClient({
    fetchAllMembers: true,
    disabledEvents: ['TYPING_START'],
	disableEveryone: true
});

sql.open('../media/db.sqlite').then(() => {
	client.init().catch(console.error);
}).catch(console.error);