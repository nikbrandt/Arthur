const { emojis } = require('../commands/fun/poll');

module.exports = (client, reaction, user) => {
	if (!reaction) return;
	if (!client.reactionCollectors.has(reaction.message.id)) return;
	if (user.id === client.user.id) return;

	let obj = client.reactionCollectors.get(reaction.message.id);

	let currentEmojis = emojis.slice(0, obj.number);
	if (!currentEmojis.includes(reaction.emoji.name)) return;

	let reactions = reaction.message.reactions.filter(reaction => currentEmojis.includes(reaction.emoji.name));
	let total = 0;

	reactions.forEach(reaction => {
		if (reaction.users.has(user.id)) total++;
	});

	if (total > 1) reaction.remove(user).catch(() => {});
};