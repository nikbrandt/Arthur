exports.run = async (message, args, suffix, client, permLevel) => {
	if (!args[0] || permLevel < 4) {
		let locale = await client.i18n.getGuildLocale(message.guild.id);
		return message.channel.send(`This server's language is ${locale}`);
	}
	
	let locales = client.i18n.getLocales();
	let localeNames = client.i18n.getLocaleNames();
	
	if (args[0] === 'list') return message.channel.send(`Currently supported locales:\n${locales.map((locale, i) => `\`${locale}\` | ${localeNames[i]}`).join('\n')}\nIf you'd like to help translate, contact Gymnophoria in the support server (in the help/info commands).`);
	if (!locales.includes(args[0])) return message.channel.send(`Invalid locale string. Must be one of ${locales.map(locale => '`' + locale + '`').join(', ')}. case-SENSITIVE.`);
	
	await client.i18n.setGuildLocale(message.guild.id, args[0]);
	message.channel.send('Guild locale set.');
};

exports.config = {
	enabled: true,
	permLevel: 2,
	aliases: [ 'serverlanguage', 'serverlocale', 'serverlang', 'guildlang', 'guildlocale' ]
};

exports.help = {
	name: 'Server Language',
	description: 'Set the language of Arthur for your server. User settings overwrite.',
	usage: 'guildlanguage [locale or "list"]',
	help: 'Set the language of Arthur for your server. User settings will overwrite if present. To get a list of languages, type `guildlanguage list`. If a language is incomplete, it will use text from English until it is complete. To help translate Arthur, ask Gymnophoria in the support server (available in the info or help commands).\nRequires admin or manage server permissions to run.',
	category: 'Server Management'
};