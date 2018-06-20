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
 * Ask a question in a channel
 * @param {TextChannel} channel Channel to send the message to
 * @param {object} embed Embed message to send
 * @param {string} whomstID User ID to collect message from
 * @param {Message} [message] Message to edit instead of sending a message
 * @param {number} [attempt] Attempt number
 * @param {object} [errorEmbed] Embed to send as an error embed
 * @returns {Promise<Object>}
 */
module.exports = (channel, embed, whomstID, message, attempt, errorEmbed) => {
	return new Promise(async (resolve, reject) => {
		if (attempt > 5) {
			message ? await message.edit('', { embed: defaultAttemptEmbed }) : await channel.send({ embed: defaultAttemptEmbed });
			return reject('attempts');
		}

		embed.footer.text = embed.footer.text.replace(/Attempt [1-5]/g, `Attempt ${attempt}`);
		const embedMessage = message ? await message.edit('', {embed}) : await channel.send({embed});

		const filter = m => m.author.id === whomstID;

		channel.awaitMessages(filter, { max: 1, time: 60000, errors: [ 'time' ] })
			.then(async collected => {
				let message = collected.first();

				message.delete().catch(() => {});

				if (message.content.toLowerCase() === 'cancel') {
					await embedMessage.edit('', {embed: defaultCancelEmbed});
					return reject('cancel');
				}

				resolve({
					response: message.content,
					message: embedMessage,
					attempt: attempt + 1
				});
			}).catch(() => {
				embedMessage.edit({ embed: errorEmbed ? errorEmbed : defaultErrorEmbed });
				reject('response');
			});
	});
};