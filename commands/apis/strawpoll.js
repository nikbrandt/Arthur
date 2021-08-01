const { askWithCondition } = require('../../functions/askQuestion');
const requestPromise = require('request-promise');

const quoteRegex = /^"([^"]+)"/;

const dupeCondition = text => {
	return [ 'normal', 'permissive', 'disabled' ].includes(text.toLowerCase());
};

let lastPoll = {
	start: null,
	last: null,
	uses: 0
};

exports.run = async (message, args, suffix) => {
	const footer = {
		text: message.__('default_footer')
	};

	const isYesNo = text => {
		let regex = new RegExp(`^(${i18n.get('booleans.yesno.abbreviations.yes', message)}(${i18n.get('booleans.yesno.abbreviations.yes_end', message)})?|${i18n.get('booleans.yesno.abbreviations.no', message)}(${i18n.get('booleans.yesno.abbreviations.no_end', message)})?)$`, 'i');
		return regex.test(text);
	}; // `
	const parseYesNo = text => {
		const lowercased = text.toLowerCase();
		return lowercased.includes(i18n.get('booleans.yesno.abbreviations.yes', message));
	};

	const multiEmbed = {
		title: message.__('multiple_votes'),
		description: message.__('multiple_votes_description'),
		color: 0x007c29,
		footer
	};

	const dupeEmbed = {
		title: message.__('duplication_checking'),
		description: message.__('duplication_checking_description'),
		color: 0x007c29,
		footer
	};

	const captchaEmbed = {
		title: 'Captcha',
		description: message.__('captcha_description'),
		color: 0x007c29,
		footer
	};

	if (!args[0]) return message.channel.send(message.__('no_title'));
	if (!args[1]) return message.channel.send(message.__('no_options'));

	if (!lastPoll.start) lastPoll.start = Date.now();
	if (!lastPoll.last) lastPoll.last = Date.now();
	if (lastPoll.last - lastPoll.start > 3600000) {
		lastPoll.start = Date.now();
		lastPoll.last = Date.now();
		lastPoll.uses = 1;
	}
	if (lastPoll.uses >= 100) return message.channel.send(message.__('too_many_polls'));

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

	if (suffix.includes(`--${message.__('advanced')}`) || suffix.includes(`--${message.__('advanced_abbreviation')}`)) {
		advanced = true;
		suffix = suffix.replace(new RegExp(` *--${message.__('advanced_abbreviation')}(${message.__('advanced_abbreviation_ending')})? *`, 'g'), '');// / *--adv(anced)? */g, '');
	}

	options = suffix.split('|');
	if (options.length < 2) return message.channel.send(message.__('not_enough_options'));
	if (options.length > 30) return message.channel.send(message.__('too_many_options'));
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
			? editMessage.edit(message.__('error', { err }), {embed: {}}).catch(() => {})
			: message.channel.send(message.__('error', { err }));
	}

	let embed = {
		title: message.__('poll_created'),
		description: message.__('it_can_be_accessed_here', { id: response.id }),
		color: 0x00c140
	};

	editMessage
		? editMessage.edit('', { embed })
		: message.channel.send({ embed });
};

exports.config = {
	enabled: true,
	permLevel: 1,
	category: 'apis'
};
