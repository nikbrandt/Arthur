const VERSION = 0.1;

exports.run = (message, args, suffix, client, perms, prefix) => {
	if (!args[0]) return message.channel.send(`Nik's Easter Egg: Duck v${VERSION} operational.\nType \`${prefix}help duck\` for usage information.`);
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
	usage: 'nik',
	help: 'An easter egg for Lumine'
};