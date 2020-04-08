const sql = require('sqlite');
const ArthurClient = require('./struct/ArthurClient');

global.__basedir = __dirname;

const client = new ArthurClient({
	disableMentions: 'everyone',
	messageCacheMaxSize: 10,
	ws: {
		intents: [
			'GUILDS',
			'GUILD_MEMBERS',
			'GUILD_VOICE_STATES',
			'GUILD_MESSAGES',
			'GUILD_MESSAGE_REACTIONS',
			'DIRECT_MESSAGES'
		]
	}
});

sql.open('../media/db.sqlite').then(() => {
	client.init().catch(console.error);
}).catch(console.error);
