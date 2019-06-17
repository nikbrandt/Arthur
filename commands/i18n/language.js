exports.run = async (message, args) => {
	if (!args[0]) {
		let locale = await i18n.getUserLocaleString(message.author.id);
		return message.channel.send(message.__('current', { locale }));
	}

	if (args[0] === 'none') {
		await i18n.removeUserLocale(message.author.id);
		return message.channel.send(message.__('removed'));
	}
	
	let locales = i18n.getLocales();
	let localeNames = i18n.getLocaleNames();
	
	if (args[0] === 'list') return message.channel.send(i18n.get('commands.guildlanguage.list', message, { locales: locales.map((locale, i) => `\`${locale}\` | ${localeNames[i]}`).join('\n') }));
	if (!locales.includes(args[0])) return message.channel.send(i18n.get('commands.guildlanguage.invalid_locale', message, { locales: locales.map(locale => '`' + locale + '`').join(', ') }));

	await i18n.setUserLocale(message.author.id, args[0]);
	message.channel.send(message.__('locale_set'));
};

exports.config = {
	enabled: true,
	permLevel: 1,
	category: 'i18n'
};