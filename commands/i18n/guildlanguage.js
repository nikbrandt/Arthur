exports.run = async (message, args, suffix, client, permLevel) => {
	if (!args[0] || permLevel < 4) {
		let locale = await i18n.getGuildLocaleString(message.guild.id);
		return message.channel.send(message.__('current_language', { locale }));
	}

	let indexOfDash = args[0].indexOf('-');

	if (indexOfDash > 0) args[0] = args[0].substring(0, indexOfDash).toLowerCase() + args[0].substring(indexOfDash).toUpperCase();
	else args[0] = args[0].toLowerCase();

	args[0] = args[0].trim();
	
	let locales = i18n.getLocales();
	
	if (!locales.includes(args[0])) return message.channel.send(message.__('invalid_locale', { locales: locales.map(locale => '`' + locale + '`').join(', ') }));
	
	await i18n.setGuildLocale(message.guild.id, args[0]);
	message.channel.send(message.__('locale_set'));
};

exports.config = {
	enabled: true,
	permLevel: 2,
	category: 'i18n'
};