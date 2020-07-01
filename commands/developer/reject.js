const { trello } = require('../misc/suggest');

exports.run = async (message, args, suffix) => {
	if (message.channel.id !== message.client.config.trello.channel) return message.channel.send('Wrong channel.');
	if (!args[0]) return message.channel.send('Please speciify which suggestion message to reject.');
	
	let suggestionMsg = await message.channel.messages.fetch(args[0]).catch(() => {});
	if (!suggestionMsg) return message.channel.send('Could not fetch message.');
	if (suggestionMsg.author.id !== message.client.user.id || !suggestionMsg.embeds[0] || !suggestionMsg.embeds[0].footer || !suggestionMsg.embeds[0].footer.text || !suggestionMsg.embeds[0].footer.text.startsWith('Suggested by'))
		return message.channel.send('Message is not a suggestion message.');
	
	let cardURLSplit = suggestionMsg.embeds[0].url.split('/');
	let cardID = cardURLSplit[cardURLSplit.length - 1];
	let splitText = suggestionMsg.embeds[0].footer.text.split(' | ');
	let suggesterID = splitText[splitText.length - 1];
	
	trello.updateCard(cardID, 'closed', true).catch(err => {
		message.channel.send('Card update failed, error logged to console.');
		console.error(err);
	}).then(() => {
		message.noDelete = true;
		
		let rejectionMessage = `Your suggestion of "${suggestionMsg.embeds[0].title}" has been rejected. `;
		if (args[1]) rejectionMessage += `Provided reason: ${suffix.slice(args[0].length + 1)}`;
		else rejectionMessage += 'No reason was provided.';
		rejectionMessage += '\nIf you\'d like to discuss this further, feel free to reply to this message.';
		
		suggestionMsg.embeds[0].color = 0xf56942;
		suggestionMsg.embeds[0].title = 'Rejected: ' + suggestionMsg.embeds[0].title;
		suggestionMsg.edit({ embed: suggestionMsg.embeds[0] }).catch(() => {});
		
		message.client.commands.get('send').run(message, [ suggesterID, 'aa'], suggesterID + ' ' + rejectionMessage, message.client).then(() => {
			message.channel.send('Suggestion rejected.');
		}).catch(() => {
			message.channel.send('Message send failed.');
		});
	});
};
	
exports.config = {
	enabled: true,
	permLevel: 9,
	category: 'developer'
};