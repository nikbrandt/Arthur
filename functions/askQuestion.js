const defaultErrorEmbed = {
	title: 'Command canceled',
	description: 'You did not respond in time.',
	footer: {
		text: 'L.'
	},
	color: 0xff0000
};

const defaultCancelEmbed = {
	title: 'Command canceled',
	description: 'You cancelled the command.',
	color: 0xff0000
};

const defaultAttemptEmbed = {
	title: 'Command canceled',
	description: 'You took too many attempts',
	footer: {
		text: 'L.'
	},
	color: 0xff0000
};

/**
 * Ask a question in a channel and resend the message if a condition is not met
 * @param {TextChannel} channel Channel to send the message to
 * @param {object} embed Embed message to send
 * @param {string} authorID User ID to collect message from
 * @param {Message} [message] Message to edit instead of sending a message
 * @param {number} [attempt] Attempt number
 * @param {object} [errorEmbed] Embed to send as an error embed
 * @param {function} condition Condition to match against message content
 * @param {number} [time=60000] Time in ms to wait for an answer
 * @param {function} [resolve] Promise resolve function
 * @param {function} [reject] Promise reject function
 * @returns {Promise<Object>}
 */
function askWithCondition (channel, embed, authorID, message, attempt, errorEmbed, condition, time, resolve, reject) {
	if (resolve) {
		askQuestion(channel, embed, authorID, message, attempt, errorEmbed, time).then(object => {
			if (!condition(object.response)) return askWithCondition(channel, embed, authorID, object.message, object.attempt, errorEmbed, condition, time, resolve, reject);
			resolve(object);
		}).catch(err => {
			reject(err);
		});
	} else {
		return new Promise((resolve, reject) => {
			askQuestion(channel, embed, authorID, message, attempt, errorEmbed, time).then(object => {
				if (!condition(object.response)) return askWithCondition(channel, embed, authorID, object.message, object.attempt, errorEmbed, condition, time, resolve, reject);
				resolve(object);
			}).catch(err => {
				reject(err);
			});
		});
	}
}

/**
 * Ask a question in a channel
 * @param {TextChannel} channel Channel to send the message to
 * @param {object} embed Embed message to send
 * @param {string} authorID User ID to collect message from
 * @param {Message} [message] Message to edit instead of sending a message
 * @param {number} [attempt] Attempt number
 * @param {object} [errorEmbed] Embed to send as an error embed
 * @param {number} [time] Time in ms to wait for an answer
 * @returns {Promise<Object>}
 */
function askQuestion (channel, embed, authorID, message, attempt, errorEmbed, time) {
	return new Promise(async (resolve, reject) => {
		if (attempt > 5) {
			message ? await message.edit({ content: '', embeds: [ defaultAttemptEmbed ] }).catch(() => {}) : await channel.send({ embeds: [ defaultAttemptEmbed ] });
			return reject('attempts');
		}

		embed.footer.text = embed.footer.text.replace(/Attempt [1-5]/g, `Attempt ${attempt}`);
		const embedMessage = message ? await message.edit({ content: '', embeds: [ embed ] }).catch(() => {}) : await channel.send({ embeds: [ embed ] });

		const filter = m => m.author.id === authorID;

		channel.awaitMessages({ filter, max: 1, time: time ? time : 60000, errors: [ 'time' ] })
			.then(async collected => {
				let message = collected.first();

				message.delete().catch(() => {});

				if (message.content.toLowerCase() === 'cancel') {
					await embedMessage.edit({ content: '', embeds: [ defaultCancelEmbed ] }).catch(() => {});
					return reject('cancel');
				}

				resolve({
					response: message.content,
					message: embedMessage,
					attempt: attempt + 1
				});
			}).catch(() => {
				embedMessage.edit({ embeds: [ errorEmbed ? errorEmbed : defaultErrorEmbed ] }).catch(() => {});
				reject('response');
			});
	});
}

module.exports = askQuestion;
askQuestion.askWithCondition = askWithCondition;