const sql = require('sqlite');
const moment = require('moment');

const { getSubredditMeme } = require('../fun/meme');

const VERSION = '0.1.2';
const THEME_COLOR = 0xfcba03;
const COIN_EMOJI = '<:duckcoin:696521259256905779>';

let init = false;
let curDuck;

setTimeout(async () => {
	let enUS = i18n._aliases.get('en-US');
	enUS.set('duck', 'nik');
	enUS.set('duk', 'nik');
	enUS.set('leet', 'nik');
	enUS.set('yikes', 'isaac'); // this is great code don't worry

	let obj = await sql.get('SELECT MAX(duckID) FROM ducks');
	curDuck = obj['MAX(duckID'];

	init = true;
}, 2000);

let meta = {
	help: {
		run: help,
		help: 'Get help using the advanced Duck system.'
	},
	balance: {
		run: balance,
		help: 'Check how much DuckCoin you have.'
	},
	daily: {
		run: daily,
		help: 'Get daily DuckCoin.',
		description: 'Get daily DuckCoin.\nRandom amount of coins given, increased if your duck is happy.'
	},
	image: {
		run: image,
		help: 'Get a duck image.',
		description: 'Get a duck image. If you have ducks, they might even reward you for adoring them.'
	},
	changelog: {
		run: changelogCommand,
		help: 'View the update changelog.'
	}
};

function help(message) {
	if (message.args[0] && meta[message.args[0].toLowerCase()]) {
		let arg = meta[message.args[0].toLowerCase()];
		
		message.channel.send({ embed: {
			color: THEME_COLOR,
			author: {
				name: message.args[0].charAt(0).toUpperCase() + message.args[0].substring(1).toLowerCase()
			},
			description: arg.description ? arg.description : arg.help,
			footer: {
				text: '<> denotes a required argument and [] denotes an optional argument. Please don\'t type them.'
			}
		}});
	} else {
		message.channel.send({ embed: {
			color: THEME_COLOR,
			author: {
				name: 'Quack.'
			},
			description: Object.keys(meta).map(key => {
				return `\`${key}\`: ${meta[key].help}`
			}).join('\n'),
			footer: {
				text: `Use ${message.prefix}duck help <argument> to view help for a specific argument. Don't include the brackets, nerd.`
			}
		}});
	}
}

async function balance(message) {
	let member = message.member;
	
	if (message.args[0]) {
		let obj = message.client.findMember(message, message.suffix);
		if (obj) member = obj.member;
	}
	
	let coins = await getUser(member.id);
	coins = coins.coins;
	
	message.channel.send({ embed: {
		title: `${member.displayName}'s Balance`,
		description: `${COIN_EMOJI} ${coins}`,
		color: THEME_COLOR
	}});
}

async function daily(message) {
	let user = await getUser(message.author.id);
	let { coins } = user;
	
	let today = moment().format('M-DD');
	if (user.lastDaily && user.lastDaily === today) return message.channel.send('You already claimed your daily DuckCoin. Nerd.');
	
	let out = '';
	let base = Math.round(Math.random() * 40) + 30;
	let modifier = 1; // TODO: Implement duck(s) happiness modifier
	
	let day = moment().format('M-D');
	if (day === '1-18') {
		out += '\nIt\'s national duck day! Coins multiplied by 10.';
		modifier *= 10;
	}
	
	if (day === '2-24') {
		out += '\nIt\'s our overlord\'s birthday! Coins multiplied by 100.';
		modifier *= 100;
	}
	
	let add = base * modifier;
	coins += add;
	
	message.channel.send({embed: {
		title: 'Daily DuckCoins!',
		color: THEME_COLOR,
		description: `${add} DuckCoins added for a total of ${COIN_EMOJI} ${coins}${out}`
	}});
	
	sql.run('UPDATE duckEconomy SET coins = ?, lastDaily = ? WHERE userID = ?', [ coins, today, message.author.id ]);
}

function image(message) {
	getSubredditMeme('duck').then(meme => {
		message.channel.send({embed: {
			title: 'Quack!',
			image: {
				url: `https://i.imgur.com/${meme.hash}${meme.ext}`
			},
			color: THEME_COLOR // TODO: Add duck happiness/xp increase (rare-ish) and coin get (somewhat rare)
		}})
	}).catch(() => {
		message.channel.send({ embed: {
			color: THEME_COLOR,
			description: 'Duck image retrieval failed. :('
		}})
	})
}

async function getUser(id) {
	let obj = await sql.get('SELECT * FROM duckEconomy WHERE userID = ?', [ id ]);

	if (!obj) {
		obj = { coins: 0 };
		sql.run('INSERT INTO duckEconomy (userID) VALUES (?)', [ id ]);
	}
	
	return obj;
}

exports.run = (message, args, suffix, client, perms, prefix) => {
	if (!init) return message.channel.send(':duck: Duck still initializing. Please come back later.');
	if (!args[0]) return message.channel.send(`:duck: Duck v${VERSION} operational.\nUse the \`help\` argument to get started.`);
	
	let func = meta[args[0].toLowerCase()];
	if (!func) return message.channel.send(`Invalid command. For help, use the \`help\` argument.`);
	func = func.run;

	message.suffix = suffix.slice(args[0].length + 1);
	message.args = args.slice(1);
	message.perms = perms;
	message.prefix = prefix;
	
	func(message);
};

exports.config = {
	enabled: true,
	permLevel: 1,
	perms: [ 'ATTACH_FILES' ],
	category: 'eggs',
	aliases: [ 'duck' ]
};

exports.meta = {
	command: 'nik',
	name: 'Nik\'s utterly wild duck command',
	description: 'An easter egg for Nik',
	usage: '',
	help: 'whoooo boy. use `duck help` to see how to use this wild command.'
};

let changelog = `**v0.1.2 - Changelogs!**
 - 100x better coin emoji added
 - \`image\` command added to view duck images
 - \`changelog\` command added. you're using it. nice.
 - "leet" alias added

**v0.1.1**
 - Framework for commands created
 - Database for ducks and duck economy created
 - Basic commands \`help\`, \`balance\`, and \`daily\` added
 - "duck" and "duk" aliases added

**v0.1 - The Beta Begins**
Duck v0.1 is created. Only a base message is shown.
 - Guidelines in [trello card](https://trello.com/c/wm6NbkBt/602-anik) for what is to come in the future created`;

function changelogCommand(message) {
	message.channel.send({ embed: {
		description: changelog,
		color: THEME_COLOR
	}});
}