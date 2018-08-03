exports.run = async (message, args, suffix, client) => {
	if (!args[0]) {
		let locale = await client.i18n.getUserLocale(message.author.id);
		return message.channel.send(`Your language is currently ${locale}.`);
	}

	let locales = client.i18n.getLocales();
	let localeNames = client.i18n.getLocaleNames();

	if (args[0] === 'list') return message.channel.send(`Currently supported locales:\n${locales.map((locale, i) => `\`${locale}\` | ${localeNames[i]}`).join('\n')}\nIf you'd like to help translate, contact Gymnophoria in the support server (in the help/info commands).`);
	if (!locales.includes(args[0])) return message.channel.send(`Invalid locale string. Must be one of ${locales.map(locale => '`' + locale + '`').join(', ')}. case-SENSITIVE.`);

	await client.i18n.setUserLocale(message.author.id, args[0]);
	message.channel.send('Locale set.');
};

exports.config = {
	enabled: true,
	permLevel: 1,
	aliases: [ 'locale', 'lang' ]
};

exports.help = {
	name: 'Language',
	description: 'Change the language of Arthur for yourself. Overrides server language.',
	usage: 'language [locale, "list", or "none"]',
	help: 'Changes the language of Arthur for yourself. Will override server language. `language list` will provide a list of languages. An incomplete language will use parts of English. To help translate, join the support server and ask about translating.',
	category: 'Other'
};