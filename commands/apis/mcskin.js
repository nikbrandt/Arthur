const request = require('request-promise');
const moment = require('moment');
const randos = ['f84c6a790a4e45e0879bcd49ebd4c4e2', '879d4fb880a84b80bc474d0f85964a47', '61699b2ed3274a019f1e0ea8c3f06bc6', '853c80ef3c3749fdaa49938b674adae6'];

async function getUUID (name) {
	let json = await request( { uri: `https://api.mojang.com/users/profiles/minecraft/${name}?at=${moment().format('x')}`, json: true } );
	if (!json || json.error) return undefined;
	else return json.id;
}

exports.run = async (message, args) => {
	let uuid;

	if (!args[0]) uuid = randos[Math.floor(Math.random() * randos.length)];
	else if (args[0].length === 36) args[0] = args[0].replace(/-/g, '');
	else if (args[0].length === 32) uuid = args[0];
	else if (args[0].length < 16) uuid = await getUUID(args[0]);
	else return message.channel.send('If only usernames could be that long..');

	if (!uuid) uuid = randos[Math.floor(Math.random() * randos.length)];

	message.channel.send({embed: {
		footer: {
			text: 'Render courtesy of Visage.'
		},
		image: {
			url: `https://visage.surgeplay.com/full/512/${uuid}.png`
		},
		color: 0x00c140
	}});
};

exports.config = {
	enabled: true,
	permLevel: 2,
	aliases: ['minecraftskin', 'skin', 'mskin'],
	perms: ['EMBED_LINKS']
};

exports.help = {
	name: 'Minecraft Skin',
	description: 'Get the skin of a Minecraft player',
	usage: 'mcskin <username/UUID>',
	help: 'Get the skin of a Minecraft player.',
	category: 'APIs'
};