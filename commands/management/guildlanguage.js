exports.run = async (message, args, suffix, client, permLevel) => {
	if (!args[0] || permLevel < 4) {
		let locale = await i18n.getGuildLocaleString(message.guild.id);
		return message.channel.send(message.__('current_language', { locale }));
	}
	
	let locales = i18n.getLocales();
	let localeNames = i18n.getLocaleNames();
	
	if (args[0] === 'list') return message.channel.send(message.__('list', { locales: locales.map((locale, i) => `\`${locale}\` | ${localeNames[i]}`).join('\n') }));
	if (!locales.includes(args[0])) return message.channel.send(message.__('invalid_locale', { locales: locales.map(locale => '`' + locale + '`').join(', ') }));
	
	await i18n.setGuildLocale(message.guild.id, args[0]);
	message.channel.send(message.__('locale_set'));
};

exports.config = {
	enabled: true,
	permLevel: 2,
	category: 'server_management'
};