const request = require('request-promise');
const moment = require('moment');

async function getUUID (name) {
	let json = await request( { uri: `https://api.mojang.com/users/profiles/minecraft/${name}?at=${moment().format('x')}`, json: true } );
	if (!json || json.error) return undefined;
	else return json.id;
}

function reverse (array) {
	let reversed = [];
	array.forEach(i => {
		reversed.unshift(i);
	});
	return reversed;
}

exports.run = async (message, args) => {
	if (!args[0]) return message.channel.send(message.__('no_args'));

	let uuid;
	let page;

	if (args[0].length === 36) args[0] = args[0].replace(/-/g, '');
	if (args[0].length === 32) uuid = args[0];
	else if (args[0].length <= 16) uuid = await getUUID(args[0]);
	else return message.channel.send(message.__('long_name'));

	if (!uuid) return message.channel.send(message.__('invalid_name'));

	if (!args[1]) page = 1;
	else {
		page = parseInt(args[1]);
		if (!page) return message.channel.send(message.__('invalid_page'));
		if (page < 0) return message.channel.send(message.__('negative_page'));
	}

	let body = await request(`https://api.mojang.com/user/profiles/${uuid}/names`);

	if (!body) return message.channel.send(message.__('no_body'));

	let json = JSON.parse(body);
	let rever = reverse(json);
	let nameArray = [];
	let dateArray = [];

	let maxPage = Math.ceil(json.length / 10);
	if (page > maxPage) return message.channel.send(message.__('page_too_high', { page }));

	let index = json.length - (page * 10 - 10);
	let reversed = rever.slice(page * 10 - 10, page * 10);

	let locale = i18n.getLocaleCode(message);
	if (locale === 'en-US') locale = 'en';

	for (let object of reversed) {
		if (index !== json.length && index >= 1) {
			nameArray.push(`${index}. ${object.name}  \u200b`);
			dateArray.push(moment(object.changedToAt).locale(locale).utc().format(i18n.get('time.moment.precise', message)));
		}
		index--;
	}

	if (!nameArray.length) nameArray = [ message.__('no_name_changes') ];

	message.channel.send({embed: {
		author: {
			name: message.__('embed_title', { name: rever[0].name }),
			icon_url: `https://visage.surgeplay.com/face/256/${uuid}.png`,
			url: `https://namemc.com/profile/${uuid}`
		},
		color: 0x00AA00,
		fields: [
			{
				name: message.__('name'),
				value: '\u200b' + nameArray.join('\n'),
				inline: true
			},
			{
				name: message.__('date_changed'),
				value: '\u200b' + dateArray.join('\n'),
				inline: true
			}
		],
		footer: {
			text: message.__('embed_footer', { page, maxPage, name: json[0].name })
		}
	}});
};

exports.config = {
	enabled: true,
	permLevel: 1,
	perms: ['EMBED_LINKS'],
	category: 'apis'
};