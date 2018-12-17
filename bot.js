global.Promise = require('bluebird');
Promise.config({
	longStackTraces: true
});

const sql = require('sqlite');
const ArthurClient = require('./struct/ArthurClient');

global.__basedir = __dirname;

const client = new ArthurClient({
    fetchAllMembers: false,
    disabledEvents: ['TYPING_START'],
	disableEveryone: true,
	messageCacheMaxSize: 10
});

sql.open('../media/db.sqlite').then(() => {
	client.init().catch(console.error);
}).catch(console.error);
