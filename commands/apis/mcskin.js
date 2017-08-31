const randos = ['Notch', 'Herobrine', 'Gymnophoria', 'Dinnerbone', 'jeb_'];

exports.run = (message, args) => {
	let skin;
	if (!args[0]) skin = randos[Math.floor(Math.random() * randos.length)];
	else skin = args[0];

	message.channel.send({embed: {
		footer: {
			text: 'Render courtesy of Visage.'
		},
		image: {
			url: `https://visage.surgeplay.com/full/512/${skin}.png`
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