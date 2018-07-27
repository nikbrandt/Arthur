const { askWithCondition } = require('../../functions/askQuestion');
const requestPromise = require('request-promise');

const quoteRegex = /^"([^"]+)"/;

const footer = {
	text: 'Command will be canceled in 15 seconds. Type "cancel" to cancel now. Attempt 1 of 5.'
};

const isYesNo = text => {
	return /^(y(es)?|no?)$/i.test(text);
};
const parseYesNo = text => {
	const lowercased = text.toLowerCase();
	return lowercased.includes('y');
};

const multiEmbed = {
	title: 'Multiple votes',
	description: 'Should users be able to submit multiple votes? <__Y__es/__N__o>',
	color: 0x007c29,
	footer
};

const dupeEmbed = {
	title: 'Duplication checking',
	description: 'How should duplication checking be handled?\n`normal` for IP checking, `permissive` for browser cookie checking, `disabled` for no checking.',
	color: 0x007c29,
	footer
};
const dupeCondition = text => {
	return [ 'normal', 'permissive', 'disabled' ].includes(text.toLowerCase());
};

const captchaEmbed = {
	title: 'Captcha',
	description: 'Should the poll include a captcha? <__Y__es/__N__o>',
	color: 0x007c29,
	footer
};

let lastPoll = {
	start: null,
	last: null,
	uses: 0
};

exports.run = async (message, args, suffix) => {
	if (!args[0]) return message.channel.send('You\'ll uh.. you\'ll need a title for that poll there.');
	if (!args[1]) return message.channel.send('You probably want some options with that poll, right?');

	if (!lastPoll.start) lastPoll.start = Date.now();
	if (!lastPoll.last) lastPoll.last = Date.now();
	if (lastPoll.last - lastPoll.start > 3600000) {
		lastPoll.start = Date.now();
		lastPoll.last = Date.now();
		lastPoll.uses = 1;
	}
	if (lastPoll.uses >= 100) return message.channel.send('I\'ve created too many polls this hour. Try again later. Sorry \'bout that.');
	
	let title;
	let options;
	let advanced = false;
	let multi = false;
	let dupcheck = 'normal';
	let captcha = false;
	let editMessage = undefined;
	
	if (quoteRegex.test(suffix)) {
		let matchedString = suffix.match(quoteRegex);
		title = matchedString[1];
		suffix = suffix.slice(matchedString[0].length);
		if (suffix.startsWith(' ')) suffix = suffix.slice(1);
	} else {
		title = args[0];
		suffix = suffix.slice(args[0].length + 1);
	}
	
	if (suffix.includes('--adv') || suffix.includes('--advanced')) {
		advanced = true;
		suffix = suffix.replace(/ *--adv(anced)? */g, '');
	}
	
	options = suffix.split('|');
	if (options.length < 2) return message.channel.send('Minimum two options. Seriously, what\'s the point in one option? What?');
	if (options.length > 30) return message.channel.send('Are you actually insane? Why do you need more than 30 options? Anyways, strollpoll.me won\'t take it, so I won\'t take it.');
	options.forEach((op, i) => {
		options[i] = op.replace(/^ *(.*) *$/, '$1');
	});
	
	if (advanced) {
		try {
			let multiObject = await askWithCondition(message.channel, multiEmbed, message.author.id, undefined, 1, undefined, isYesNo, 15000);
			multi = parseYesNo(multiObject.response);
			let dupeObject = await askWithCondition(message.channel, dupeEmbed, message.author.id, multiObject.message, 1, undefined, dupeCondition, 15000);
			dupcheck = dupeObject.response.toLowerCase();
			let captchaObject = await askWithCondition(message.channel, captchaEmbed, message.author.id, dupeObject.message, 1, undefined, isYesNo, 15000);
			captcha = parseYesNo(captchaObject.response);
			editMessage = captchaObject.message;
		} catch (e) {
			return e;
		}
	}
	
	let response;
	try {
		response = await requestPromise({
			method: 'POST',
			uri: 'https://www.strawpoll.me/api/v2/polls',
			headers: {
				'User-Agent': 'Arthur Discord Bot (https://github.com/Gymnophoria/Arthur)'
			},
			body: { title, options, multi, dupcheck, captcha },
			json: true
		});
	} catch (err) {
		err = err.stack ? err.stack.split('\n')[0] : err;
		return editMessage
			? editMessage.edit(`Error while creating poll: ${err}\nPlease report this in the support server if you'd like it fixed.`, {embed: {}}).catch(() => {})
			: message.channel.send(`Error while creating poll: ${err}\nPlease report this in the support server if you'd like it fixed.`);
	}
	
	let embed = {
		title: 'Poll created',
		description: `It can be accessed (here)[https://www.strawpoll.me/${response.id}]`,
		color: 0x007c29
	};
	
	editMessage
		? editMessage.edit('', { embed })
		: message.channel.send({ embed });
};

exports.config = {
	enabled: true,
	permLevel: 1,
	aliases: [ 'sp', 'straw' ]
};

exports.help = {
	name: 'Strawpoll',
	description: 'Create a strawpoll.',
	usage: 'strawpoll <"title"> <option one|option two|etc..> [--adv or --advanced]',
	help: 'Create a strawpoll on strawpoll.me.\nUsing the --adv flag allows configuration of advanced options:\nmultiple votes (default false)\nduplication checking (default IP checking\ncaptcha (default false)',
	category: 'APIs'
};