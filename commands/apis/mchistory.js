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

exports.run = async (message, args, suffix, client, permLevel) => {
	if (!args[0]) return message.channel.send('Alright, so here\'s your name history:\n3. You_need\n2. To_provide\n1. Me_with_a_name');

	let uuid;
	let page;

	if (args[0].length === 36) args[0] = args[0].replace(/-/g, '');
	if (args[0].length === 32) uuid = args[0];
	else if (args[0].length <= 16) uuid = await getUUID(args[0]);
	else return message.channel.send('If only usernames could be that long..');

	if (!uuid) return message.channel.send('Yeah, that\'s not a name.');

	if (!args[1]) page = 1;
	else {
		page = parseInt(args[1]);
		if (!page) return message.channel.send('That\'s really not a valid page number, I\'m sorry.');
		if (page < 0) return message.channel.send('Negative pages? Really?');
	}

	let body = await request(`https://api.mojang.com/user/profiles/${uuid}/names`);

	if (!body) return message.channel.send('Something broke. You sure you spelt that correctly?');

	let json = JSON.parse(body);
	let rever = reverse(json);
	let nameArray = [];
	let dateArray = [];

	let maxPage = Math.ceil(json.length / 10);
	if (page > maxPage) return message.channel.send('This person hasn\'t quite changed their name enough to generate page ' + page + '. rip.');

	let index = json.length - (page * 10 - 10);
	let reversed = rever.slice(page * 10 - 10, page * 10);

	for (let object of reversed) {
		if (index !== json.length && index !== 1) {
			nameArray.push(`${index}. ${object.name}  \u200b`);
			dateArray.push(moment(object.changedToAt).utc().format('MMM Do YYYY [at] hh:mm A'));
		}
		index--;
	}

	if (!nameArray.length) nameArray = ['Nothin\' to see here, carry on.']

	message.channel.send({embed: {
		author: {
			name: `Name history of ${rever[0].name}`,
			icon_url: `https://visage.surgeplay.com/face/256/${uuid}.png`,
			url: `https://namemc.com/profile/${uuid}`
		},
		color: 0x00AA00,
		fields: [
			{
				name: 'Name',
				value: '\u200b' + nameArray.join('\n'),
				inline: true
			},
			{
				name: 'Date Changed',
				value: '\u200b' + dateArray.join('\n'),
				inline: true
			}
		],
		footer: {
			text: `Page ${page} of ${maxPage} | Original username was ${json[0].name}`
		}
	}});
};

exports.config = {
	enabled: true,
	permLevel: 1,
	aliases: [],
	perms: ['EMBED_LINKS']
};

exports.help = {
	name: 'Minecraft Name History',
	description: 'View all the previous names of a Minecraft user.',
	usage: 'mchistory <name/UUID> [page]',
	help: 'View the previous names of a Minecraft user, by username or UUID.',
	category: 'APIs'
};