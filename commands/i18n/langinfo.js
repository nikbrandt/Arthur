exports.run = (message, args) => {
	if (!args[0]) return message.channel.send(message.__('no_language_specified'));

	let indexOfDash = args[0].indexOf('-');

	if (indexOfDash > 0) args[0] = args[0].substring(0, indexOfDash).toLowerCase() + args[0].substring(indexOfDash).toUpperCase();
	else args[0] = args[0].toLowerCase();

	args[0] = args[0].trim();

	let locale = i18n.getLocale(args[0]);
	if (!locale) return message.channel.send(message.__('locale_not_found'));

	let { meta } = locale;

	message.channel.send({ embeds: [{
		title: meta.lang,
		description: `:flag_${meta.flag}: *${i18n.get(`meta.translations.${args[0]}`, message)}*\n\n` + message.__('description', { authors: meta.authors.join(', '), percent: meta.percentComplete, code: args[0] }),
		color: 0x00c140
	}]});
};

exports.config = {
	enabled: true,
	permLevel: 1,
	category: 'i18n'
};
