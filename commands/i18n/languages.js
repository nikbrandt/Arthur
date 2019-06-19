exports.run = (message) => {
	const locales = i18n.getAllLocaleMeta();
	
	let descriptionArray = [];
	let localeCode = i18n.getLocaleCode(message);
	
	locales.keyArray().forEach(locale => {
		let meta = locales.get(locale);
		descriptionArray.push(`:flag_${meta.flag}: \`${locale}\` **${meta.lang}** (${meta.translations[localeCode]}) | ${message.__('percent_complete', { percent: meta.percentComplete } )}`);
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