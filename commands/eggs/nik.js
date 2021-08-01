const moment = require('moment');
const needle = require('needle');
const Canvas = require('canvas');
const { WebhookClient } = require('discord.js');

const { errorLog } = require('../../functions/eventLoader');
const { getSubredditMeme } = require('../fun/meme');
const findMember = require('../../functions/findMember');

const config = require('../../../media/config.json');

const VERSION = '0.1.3';
const THEME_COLOR = 0xfcba03;
const COIN_EMOJI = '<:duckcoin:696521259256905779>';

let init = false;
let curDuck;
let pastLeaderboard;

let interval = setInterval(() => {
	if (i18n && sql && sql.get) {
		clearInterval(interval);
		start().catch(errorLog.simple);
	}
}, 1000);

async function start() {
	let enUS = i18n._aliases.get('en-US');
	enUS.set('duck', 'nik');
	enUS.set('duk', 'nik');
	enUS.set('leet', 'nik');
	enUS.set('yikes', 'isaac'); // this is great code don't worry

	let obj = await sql.get('SELECT MAX(duckID) FROM ducks');
	curDuck = obj['MAX(duckID'];

	Canvas.registerFont('../media/fonts/Impact.ttf', { family: 'Impact' });

	pastLeaderboard = await sql.all(`SELECT userID, coins FROM duckEconomy ORDER BY coins DESC LIMIT 11`);

	setInterval(sendLedger, 1000 * 60 * 10);

	init = true;
}

let meta = {
	help: {
		run: help,
		help: 'Get help using the advanced Duck system.',
		aliases: [ '?', 'halp' ]
	},
	balance: {
		run: balance,
		help: 'Check how much DuckCoin you have.',
		aliases: [ 'coins', 'bal' ]
	},
	transfer: {
		run: transfer,
		help: 'Transfer DuckCoin to someone else.',
		description: 'This transfer is instant and only reversible by the transfer recepient (via another transfer).',
		usage: '<amount> <user>',
		aliases: [ 'send' ]
	},
	daily: {
		run: daily,
		help: 'Get daily DuckCoin.',
		description: 'Random amount of coins given, increased if your duck is (or ducks are) happy.'
	},
	leaderboard: {
		run: leaderboard,
		help: 'View the DuckCoin leaderboard.',
		usage: '[page]',
		aliases: [ 'top', 'lb' ]
	},
	image: {
		run: image,
		help: 'Get a duck image.',
		description: 'If you have ducks, they might even reward you for adoring them.'
	},
	quote: {
		run: quote,
		help: `Get an inspirational quote for 10 ${COIN_EMOJI}.`,
		aliases: [ 'inspiration' ]
	},
	changelog: {
		run: changelog,
		help: 'View the update changelog.'
	}
};

let aliases = {};

Object.keys(meta).forEach(key => {
	let keyAliases = meta[key].aliases;
	if (!keyAliases) return;
	if (typeof keyAliases === 'string') aliases[keyAliases] = meta[key];
	else for (const alias of keyAliases)
		aliases[alias] = meta[key];
});

async function getUser(id) {
	let obj = await sql.get('SELECT * FROM duckEconomy WHERE userID = ?', [ id ]);

	if (!obj) {
		obj = { coins: 0 };
		sql.run('INSERT INTO duckEconomy (userID) VALUES (?)', [ id ]);
	}

	return obj;
}

/**
 * Evaluates whether or not rebel duck will appear
 * @param {number} [probability] The probability to base the rebel's appearance off of. Defaults to 0.05.
 * @returns {boolean|string} Either a boolean denoting whether the rebel should appear, or his reasoning for appearing.
 */
function rebelDuck(probability = 0.05) {
	const date = moment().format('M-D');
	const time = moment().format('HH:mm');

	if (date === '4-20') return 'It\'s a fine day to smoke weed';
	if (date === '6-9') return '69 heheehehehe';
	if (time === '4:20') return 'My joint told me to visit';
	if (time === '11:11') return 'It\'s a lucky time';

	return Math.random() < probability;
}

// -------------------------------------
//    Webhook (Ledger) Implementation
// -------------------------------------

const ledgerWebhook = new WebhookClient(config.duckLog.id, config.duckLog.token);
let ledger = [];

async function sendLedger() {
	if (ledger.length === 0) return;

	let chars = 2500;
	let embed = -1;
	let embeds = [];

	while (ledger.length > 0) {
		let string = getLedgerString(ledger.shift());
		chars += string.length + 1;

		if (chars > 2048) {
			embed++;
			chars = string.length;

			embeds.push({
				color: THEME_COLOR,
				description: string
			});
		} else {
			embeds[embed].description += '\n' + string;
		}
	}

	await ledgerWebhook.send({ embeds });

	ledger = [];
}

function getLedgerString(ledgerObject) {
	switch (ledgerObject.type) {
		case 'transfer':
			return `**${ledgerObject.amount}** ${COIN_EMOJI} transferred from **${ledgerObject.from}** (${ledgerObject.senderBal}) to **${ledgerObject.to}** (${ledgerObject.receiverBal})`;
		case 'leaderboard':
			return `**${ledgerObject.user}** moved from leaderboard position **${ledgerObject.from}** to **${ledgerObject.to}**`;
	}
}

async function checkLeaderboardChange(client) {
	let curLeaderboard = await sql.all(`SELECT userID, coins FROM duckEconomy ORDER BY coins DESC LIMIT 11`);

	for (let i = 0; i < 10; i++) {
		if (!pastLeaderboard[i]) break;
		if (pastLeaderboard[i].userID === curLeaderboard[i].userID) continue;

		let newPos = curLeaderboard.findIndex(obj => obj.userID === pastLeaderboard[i].userID);

		ledger.push({
			type: 'leaderboard',
			user: (await client.users.fetch(pastLeaderboard[i].userID)).username,
			from: i + 1,
			to: newPos + 1
		})
	}

	pastLeaderboard = curLeaderboard;
}

// --------------------------------------
//    Arguments (commands) begin here.
// --------------------------------------

function help(message) {
	if (message.args[0] && (meta[message.args[0].toLowerCase()] || aliases[message.args[0].toLowerCase()])) {
		let arg = meta[message.args[0].toLowerCase()] || aliases[message.args[0].toLowerCase()];

		message.channel.send({ embed: {
			color: THEME_COLOR,
			author: {
				name: arg.run.name.charAt(0).toUpperCase() + arg.run.name.substring(1)
			},
			description: arg.help + (arg.description ? '\n' + arg.description : '')
				+ (arg.aliases ? '\nAliases: `' + arg.aliases.join('`, `') + '`' : '')
				+ '\nUsage: `' + arg.run.name + (arg.usage ? ' ' + arg.usage + '`' : '`'),
			footer: {
				text: '<> denotes a required argument and [] denotes an optional argument. Don\'t type the brackets.'
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

async function transfer(message) {
	if (!message.args[0]) return message.channel.send('Please provide a sum to transfer (see `help transfer`).');
	if (!message.args[1]) return message.channel.send('Please provide a user to transfer to (see `help transfer`).');

	let obj = findMember(message, message.suffix.slice(message.args[0].length + 1));
	if (!obj) return message.channel.send('Could not find provided user.');
	if (obj.user.id === message.author.id) return message.channel.send('Circular transfers aren\'t that helpful, unfortunately.');

	let [ user ] = await Promise.all([
		sql.get('SELECT coins FROM duckEconomy WHERE userID = ?', [ message.author.id ]),
		sql.run('INSERT OR IGNORE INTO duckEconomy (userID) VALUES (?)', [ message.author.id ]),
		sql.run('INSERT OR IGNORE INTO duckEconomy (userID) VALUES (?)', [ obj.user.id ])
	]);
	if (!user) user = { coins: 0 };

	let num = parseInt(message.args[0]);
	if (!num) return message.channel.send('Invalid transfer amount provided (see `help transfer`).');
	if (num < 0) return message.channel.send('Heh. Nice try.');
	if (num === 0) return message.channel.send('Zero coins successfully transfered. Dweeb.');
	if (num > user.coins) return message.channel.send('You can\'t afford that transfer.');

	await Promise.all([
		sql.run('UPDATE duckEconomy SET coins = coins - ? WHERE userID = ?', [ num, message.author.id ]),
		sql.run('UPDATE duckEconomy SET coins = coins + ? WHERE userID = ?', [ num, obj.user.id ])
	]);

	message.channel.send({embed: {
		description: `${message.member.displayName}, you've transfered ${COIN_EMOJI}${num} to ${obj.member.displayName}.`,
		color: THEME_COLOR
	}});

	ledger.push({
		type: 'transfer',
		from: message.author.username,
		to: obj.user.username,
		amount: num,
		senderBal: user.coins - num,
		receiverBal: (await sql.get('SELECT coins FROM duckEconomy WHERE userID = ?', [ obj.user.id ])).coins
	});

	checkLeaderboardChange(message.client).catch(errorLog.simple);
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

	await sql.run('UPDATE duckEconomy SET coins = ?, lastDaily = ? WHERE userID = ?', [ coins, today, message.author.id ]);

	checkLeaderboardChange(message.client).catch(errorLog.simple);
}

const ENTRIES_PER_PAGE = 10;
const emojiArray = [ '👑', ':two:', ':three:', ':four:', ':five:', ':six:', ':seven:', ':eight:', ':nine:', ':keycap_ten:' ];
const numberToEmoji = num => {
	if (num <= 10) return emojiArray[num - 1];
	else return num + '.';
};
async function leaderboard(message) {
	let page = 1;

	if (message.args[0]) {
		page = parseInt(message.args[0]);
		if (!page) return message.channel.send('Invalid page number.');
		if (page < 1) return message.channel.send('Please choose a page number of at least 1.');
	}

	let entries = await sql.all(`SELECT userID, coins FROM duckEconomy`);

	let maxPage = Math.ceil(entries.length / ENTRIES_PER_PAGE);
	if (page > maxPage) return message.channel.send(`Please choose a page number within the page range (max of ${maxPage} at current)`);

	entries = entries.sort((a, b) => a.coins < b.coins ? 1 : -1);

	let userLocation = entries.findIndex(entry => entry.userID === message.author.id);
	let userPage = Math.floor(userLocation / ENTRIES_PER_PAGE);

	entries = entries.slice(page * ENTRIES_PER_PAGE - ENTRIES_PER_PAGE, page * ENTRIES_PER_PAGE);
	let num = page * ENTRIES_PER_PAGE - ENTRIES_PER_PAGE + 1;

	let formattedEntries = [];
	for (let entry of entries) {
		let user = await message.client.users.fetch(entry.userID);
		let name = num === 1 ? `**${user.username} | ${entry.coins} coins**` : `${user.username} | ${entry.coins} coins`;
		formattedEntries.push(numberToEmoji(num) + ' ' + name);
		num++;
	}

	message.channel.send({ embed: {
		title: `${COIN_EMOJI} DuckCoin Leaderboard`,
		description: formattedEntries.join('\n'),
		color: THEME_COLOR,
		footer: {
			text: `Page ${page} of ${maxPage} | You are rank ${userLocation + 1} on page ${userPage + 1}.`
		}
	}})
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

function splitInHalf(text) {
	let split = [ '', '' ];
	let spacedOut = text.split(' ');

	for (let i = 0; i < Math.floor(spacedOut.length / 2); i++) {
		split[0] += spacedOut[i] + ' ';
		split[1] += spacedOut[Math.floor(spacedOut.length / 2) + i] + ' ';
	}

	split[0] = split[0].slice(0, -1);
	split[1] = split[1].slice(0, -1);

	if (spacedOut.length % 2 === 1) split[1] += spacedOut[spacedOut.length - 1];
	return split;
}
let quotes;
let quoteReset;
async function quote(message) {
	if (!quotes || moment().format('D') !== quoteReset) {
		quotes = JSON.parse((await needle('get', 'https://type.fit/api/quotes', { json: true })).body);
		quoteReset = moment().format('D');
	}

	let [ user ] = await Promise.all([
		sql.get('SELECT coins FROM duckEconomy WHERE userID = ?', [ message.author.id ]),
		sql.run('INSERT OR IGNORE INTO duckEconomy (userID) VALUES (?)', [ message.author.id ])
	]);
	if (!user) user = { coins: 0 };

	if (user.coins < 10) return message.channel.send(`You can't afford the holy word of the ducks right now. Come back when you have at least 10 ${COIN_EMOJI}.`);
	sql.run('UPDATE duckEconomy SET coins = coins - 10 WHERE userID = ?', [ message.author.id ]);

	getSubredditMeme('duck').then(async meme => {
		const quote = quotes[Math.floor(Math.random() * quotes.length)].text;

		let split = quote.replace(/(\.\.\.|\.\.|[.!?,;:])/g, '$1\n').split('\n').filter(item => !!item);
		if (split.length === 1) split = splitInHalf(quote);
		let tooLong = true;

		while (tooLong) {
			tooLong = false;
			for (let i = 0; i < split.length; i++) {
				if (split[i].length > 35) {
					let [ firstHalf, secondHalf ] = splitInHalf(split[i]);
					split.splice(i, 1, firstHalf);
					split.splice(++i, 0, secondHalf);
					tooLong = true;
				}
			}
		}

		const canvas = Canvas.createCanvas(meme.width, meme.height);
		const ctx = canvas.getContext('2d');

		const middle = Math.floor(meme.width / 2);
		let duckImage = await Canvas.loadImage(`https://i.imgur.com/${meme.hash}${meme.ext}`);

		ctx.drawImage(duckImage, 0, 0);

		ctx.strokeStyle = 'black';
		ctx.fillStyle = 'white';
		ctx.textAlign = 'center';

		function fillText(text, height, backwards) {
			ctx.font = '10px Impact';
			let textWidth = ctx.measureText(text).width;
			let fontSize = Math.round(0.9 * meme.width * 10 / textWidth);
			if (fontSize > (meme.height * 0.2)) fontSize = Math.floor(meme.height * 0.2);

			ctx.font = `${fontSize}px Impact`;
			ctx.lineWidth = Math.floor(fontSize * .07);

			if (backwards) height += fontSize;
			ctx.strokeText(text, middle, height);
			ctx.fillText(text, middle, height);

			return fontSize;
		}

		let curHeight = 10;
		for (let i = 0; i < Math.floor(split.length / 2); i++) {
			let fontSize = fillText(split[i], curHeight, true);
			curHeight += fontSize + 10;
		}

		curHeight = meme.height - 20;
		for (let i = split.length - 1; i >= Math.floor(split.length / 2); i--) {
			let fontSize = fillText(split[i], curHeight);
			curHeight -= fontSize + 10;
		}

		message.channel.send(`You have been charged 10 ${COIN_EMOJI}. Enjoy.`, { files: [{ attachment: canvas.toBuffer(), name: 'inspiration.png' }] });
	}).catch(err => {
		message.client.errorLog('Error getting subreddit meme in duck command', err);
		message.channel.send(`The ducks are not with us today, because I cannot get a duck image. At least the 10 ${COIN_EMOJI} transfer from your account worked.`);
	})
}

exports.run = (message, args, suffix, client, perms, prefix) => {
	if (!init) return message.channel.send(':duck: Duck still initializing. Please try again.');
	if (!args[0]) return message.channel.send(`:duck: Duck v${VERSION} operational.\nUse the \`help\` argument to get started.`);

	let func = meta[args[0].toLowerCase()] || aliases[args[0].toLowerCase()];
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
	permLevel: 2,
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

let changelogText = `**v0.6**
 - Added duck ledger to track transfers and top 10 leaderboard position changes
   - Channel is in Arthur's server
 - Some internal code improvements

**v0.5.1**
 - Show \`usage\` field in help for individual arguments, as was intended
 - Fix leaderboard page/rank display in footer

**v0.5**
Been a hot sec, but I didn't *entirely* forget, I promise.
 - \`quote\` command so you can spend your daily BTC on something
 - Implemented some rebel duck code, you'll see him in a future update
 - Fixed leaderboard bugs pertaining to number 8 and number 10

**v0.4**
 - \`leaderboard\` command added so you can say you're cooler than your friends
 - \`transfer\` command added so you can make your friends cooler than you
 - Command aliases added (e.g. \`lb\` for leaderboard) Use the help command with another command to view its aliases.
 - Command usages added. View the help menu of a specific command to view its usage.
 - Learned how [semantic versioning](https://semver.org/) actually worked, and updated version numbers to reflect it (which, by the way, is totally something you *don't* do with semantic versioning).

**v0.3 - Changelogs!**
 - 100x better coin emoji added
 - \`image\` command added to view duck images
 - \`changelog\` command added. you're using it. nice.
 - "leet" alias added

**v0.2**
 - Framework for commands created
 - Database for ducks and duck economy created
 - Basic commands \`help\`, \`balance\`, and \`daily\` added
 - "duck" and "duk" aliases added

**v0.1 - The Beta Begins**
Duck v0.1 is created. Only a base message is shown.
 - Guidelines in [trello card](https://trello.com/c/wm6NbkBt/602-anik) for what is to come in the future created`;

function changelog(message) {
	message.channel.send({ embed: {
		description: changelogText,
		color: THEME_COLOR
	}});
}
