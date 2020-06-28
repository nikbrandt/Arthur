exports.run = (message) => {
	const locales = i18n.getAllLocaleMeta();
	
	let descriptionArray = [];
	let localLocaleCode = i18n.getLocaleCode(message);
	let localLocale = locales.get(localLocaleCode);
	
	locales.keyArray().forEach(locale => {
		let meta = locales.get(locale);
		descriptionArray.push(`:flag_${meta.flag}: \`${locale}\` **${meta.lang}** (${localLocale.translations[locale]}) | ${message.__('percent_complete', { percent: meta.percentComplete } )}`);
	});
	
	message.channel.send({ embed: {
		title: message.__('languages'),
		description: descriptionArray.join('\n') + '\n\n' + message.__('description'),
		color: 0x00c140
	}});
};

exports.config = {
	enabled: true,
	permLevel: 1,
	category: 'i18n'
};