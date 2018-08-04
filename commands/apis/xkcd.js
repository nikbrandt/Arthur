const request = require('request-promise');
const moment = require('moment');

function send (message, json) {
	let timeString = moment(`${json.month}-${json.day}-${json.year}`, 'M-D-YYYY').format(i18n.get('time.moment.date_only_nice', message));

	message.channel.send({embed: {
		title: json.title,
		url: `https://xkcd.com/${json.num}`,
		description: json.alt,
		image: {
			url: json.img
		},
		footer: {
			text: `#${json.num} | ${timeString}`
		},
		color: 0xffffff
	}});
}

exports.run = async (message, args) => {
	let latest = await request( { uri: 'https://xkcd.com/info.0.json', json: true } );
	let comic;

	if (args[0] === message.__('latest')) comic = latest.num;
	else if (!args[0] || args[0] === message.__('random')) comic = Math.ceil(Math.random() * latest.num);
	else {
		let parsed = parseInt(args[0]);
		if (!parsed) return message.channel.send(i18n.get('parsing.invalid_number', message));
		if (parsed < 0) return message.channel.send(message.__('negative_number'));
		if (parsed > latest.num) return message.channel.send(message.__('comic_not_created'));

		comic = parsed;
	}

	if (comic === latest.num) send(message, latest);
	else send(message, await request( { uri: `https://xkcd.com/${comic}/info.0.json`, json: true } ))
};

exports.config = {
	enabled: true,
	permLevel: 1,
	aliases: [],
	perms: ['EMBED_LINKS']
};

exports.help = {
	name: 'xkcd',
	description: 'Get a random, chosen, or latest xkcd comic.',
	usage: 'xkcd [random/latest/number]',
	help: 'Get a random, chosen, or the latest xkcd comic.',
	category: 'APIs'
};