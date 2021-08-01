exports.run = async (message, args) => {
	if (!args[0]) {
		let locale = await i18n.getUserLocaleString(message.author.id);
		return message.channel.send(message.__('current', { locale }));
	}

	if (args[0].toLowerCase() === message.__('none')) {
		await i18n.removeUserLocale(message.author.id);
		return message.channel.send(message.__('removed'));
	}

	let indexOfDash = args[0].indexOf('-');

	if (indexOfDash > 0) args[0] = args[0].substring(0, indexOfDash).toLowerCase() + args[0].substring(indexOfDash).toUpperCase();
	else args[0] = args[0].toLowerCase();

	args[0] = args[0].trim();

	let locales = i18n.getLocales();

	if (!locales.includes(args[0])) return message.channel.send(i18n.get('commands.guildlanguage.invalid_locale', message, { locales: locales.map(locale => '`' + locale + '`').join(', ') }));

	await i18n.setUserLocale(message.author.id, args[0]);
	message.channel.send(message.__('locale_set'));
};

exports.config = {
	enabled: true,
	permLevel: 1,
	category: 'i18n'
};
