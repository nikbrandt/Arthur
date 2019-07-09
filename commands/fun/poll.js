const ms = require('ms');
const moment = require('moment');
const sql = require('sqlite');
const { askWithCondition } = require('../../functions/askQuestion');

const emojis = [ '🇦', '🇧', '🇨', '🇩', '🇪', '🇫', '🇬', '🇭', '🇮', '🇯' ];

const titleCondition = (title) => {
	return !!title;
};

const optionsCondition = options => {
	return options.split('|')[1] && options.split('|').length <= 10;
};

const timeCondition = string => {
	let time = parseTimeString(string);
	return time && time < 604800001;
};

function parseTimeString (string) {
	let time = 0;
	string.split(' ').forEach(s => {
		if (!s) return;
		let thingy = ms(s);
		if (!thingy) return;
		time += thingy;
	});
	return time;
}

function emojiDescription (array) {
	let newArray = [];
	array.forEach((text, i) => {
		newArray.push(`${emojis[i]} ${text}`);
	});
	return newArray.join('\n');
}

async function addReactions (message, number) {
	for (let i = 0; i < number; i++) {
		await message.react(emojis[i]);
	}
}

function watch (message, options, endDate, client, embed) {
	const locale = i18n.getLocaleCode(message.guild);
	
	client.reactionCollectors.set(message.id, {
		message: message,
		number: options.length,
		options: options,
		embed: embed,
		locale: locale,
		finish: finishThisInstance
	});
	
	function finishThisInstance() {
		finish(message.id, client, locale);
	}

	setTimeout(() => {
		finishThisInstance();
	}, endDate - Date.now());
}

function finish (messageID, client, locale) {
	let obj = client.reactionCollectors.get(messageID);
	if (!obj) return;
	
	let theseEmojis = emojis.slice(0, obj.options.length);
	let emojiObject = {};
	let { embed } = obj;

	obj.message.reactions.forEach(reaction => {
		if (!theseEmojis.includes(reaction.emoji.name)) return;
		emojiObject[reaction.emoji.name] = reaction.count - 1;
	});

	let total = calculateTotalResults(theseEmojis, emojiObject);
	embed.description = finishedEmojiDescription(theseEmojis, emojiObject, obj.options, total);
	embed.footer.text = i18n.getString('commands.poll.ended', locale);
	embed.title = i18n.getString('commands.poll.finished', locale) + embed.title;
	embed.color = 0x42f4a1;

	obj.message.channel.send({ embed: obj.embed });
	obj.message.delete().catch(() => {});
	sql.run('DELETE FROM pollReactionCollectors WHERE messageID = ?', [obj.message.id]).catch(console.log);
	client.reactionCollectors.delete(messageID);
}

function finishedEmojiDescription (emojiArray, emojiObject, options, total) {
	let final = [];
	emojiArray.forEach((emoji, i) => {
		let count = emojiObject[emoji];
		let percentage = Math.round(count / total * 100);
		let fullEmojis = Math.round(percentage / 10);
		final.push(`${options[i]} - ${count} of ${total} - ${percentage}%\n${':large_blue_diamond:'.repeat(fullEmojis)}${':black_small_square:'.repeat(10 - fullEmojis)}`);
	});
	return final.join('\n');
}

function calculateTotalResults (emojiArray, emojiObject) {
	let total = 0;
	emojiArray.forEach(emoji => {
		total += emojiObject[emoji];
	});
	return total;
}

exports.run = async (message, a, s, client) => {
	const footer = {
		text: message.__('footer')
	};

	const titleEmbed = {
		title: message.__('title.title'),
		description: message.__('title.description'),
		color: 0x007c29,
		footer: footer
	};

	const optionsEmbed = {
		title: message.__('options.title'),
		description: message.__('options.description'),
		color: 0x00892d,
		footer: footer
	};

	const timeEmbed = {
		title: message.__('time.title'),
		description: message.__('time.description'),
		color: 0x008e2e,
		footer: footer
	};
	
	
	let title;
	let options;
	let time;
	let embedMessage;
	let err;

	try {
		let titleObj = await askWithCondition(message.channel, titleEmbed, message.author.id, undefined, 1, undefined, titleCondition);
		title = titleObj.response;
		let optionsObj = await askWithCondition(message.channel, optionsEmbed, message.author.id, titleObj.message, 1, undefined, optionsCondition);
		options = optionsObj.response;
		let timeObj = await askWithCondition(message.channel, timeEmbed, message.author.id, optionsObj.message, 1, undefined, timeCondition);
		time = timeObj.response;
		embedMessage = timeObj.message;
	} catch (e) {
		err = e;
	}
	
	if (err) return;

	options = options.split('|');
	options.forEach((op, i) => {
		options[i] = op.replace(/^ *(.*) *$/g, '$1');
	});
	time = parseTimeString(time);

	let embed = {
		title: title,
		description: emojiDescription(options),
		footer: {
			text: message.__('ends') + ' '
		},
		timestamp: moment(Date.now() + time).toISOString(),
		color: 0x00c140
	};

	embedMessage.edit({ embed });

	await addReactions(embedMessage, options.length).catch(() => {});

	let endDate = Date.now() + time;

	await sql.run('INSERT INTO pollReactionCollectors (channelID, messageID, options, endDate, embed) VALUES (?, ?, ?, ?, ?)',
		[embedMessage.channel.id, embedMessage.id, JSON.stringify(options), endDate, JSON.stringify(embed)]).catch(console.log);

	watch(embedMessage, options, endDate, client, embed);
};

exports.config = {
	enabled: true,
	permLevel: 3,
	perms: [ 'EMBED_LINKS', 'ADD_REACTIONS' ],
	category: 'other'
};

exports.watch = watch;
exports.emojis = emojis;