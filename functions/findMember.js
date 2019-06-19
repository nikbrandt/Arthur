module.exports = (message, string) => {
	let member;
	if (message.mentions.members && message.mentions.members.last() && message.mentions.members.last().id !== message.client.user.id) member = message.mentions.members.last();
	else if (!!string) {
		let find = message.guild.members.find(mem => mem.user.tag.toUpperCase() === string.toUpperCase());
		if (!find) find = message.guild.members.find(mem => mem.user.username.toUpperCase() === string.toUpperCase());
		if (!find) find = message.guild.members.find(mem => mem.displayName.toUpperCase() === string.toUpperCase());
		if (!find) find = message.guild.members.get(string);
		if (!find) return undefined;
		else member = find;
	} else member = message.member;
	return {
		user: member.user,
		member: member
	};
};