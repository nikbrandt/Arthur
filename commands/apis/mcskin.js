const request = require('request-promise');
const moment = require('moment');
const randos = ['f84c6a790a4e45e0879bcd49ebd4c4e2', '879d4fb880a84b80bc474d0f85964a47', '61699b2ed3274a019f1e0ea8c3f06bc6', '853c80ef3c3749fdaa49938b674adae6'];

async function getUUID (name) {
	let json = await request( { uri: `https://api.mojang.com/users/profiles/minecraft/${name}?at=${moment().format('x')}`, json: true } );
	if (!json || json.error) return undefined;
	else return json.id;
}

exports.run = async (message, args) => {
	let fake = false;
	let uuid;

	if (!args[0]) {
		fake = true;
		uuid = randos[Math.floor(Math.random() * randos.length)];
	}
	else if (args[0].length === 36) args[0] = args[0].replace(/-/g, '');
	else if (args[0].length === 32) uuid = args[0];
	else if (args[0].length <= 16) uuid = await getUUID(args[0]);
	else return message.channel.send(i18n.get('commands.mchistory.long_name', message));

	if (!uuid) {
		fake = true;
		uuid = randos[Math.floor(Math.random() * randos.length)];
	}

	message.channel.send({embed: {
		title: message.__('embed.title', { user: fake ? message.__('some_rando') : args[0] }),
		url: `https://namemc.com/profile/${uuid}`,
		footer: {
			text: message.__('embed.footer')
		},
		image: {
			url: `https://visage.surgeplay.com/full/512/${uuid}.png`
		},
		color: 0x00c140
	}});
};

exports.config = {
	enabled: true,
	permLevel: 1,
	perms: ['EMBED_LINKS'],
	category: 'apis'
};
