module.exports = (message, string) => {
	let member;
	
	if (message.mentions.members) member = message.mentions.members.find(mem => mem.id !== message.client.user.id);
	
	if (!member && !!string) {
		let find = message.guild.members.cache.find(mem => mem.user.tag.toUpperCase() === string.toUpperCase());
		if (!find) find = message.guild.members.cache.find(mem => mem.user.username.toUpperCase() === string.toUpperCase());
		if (!find) find = message.guild.members.cache.find(mem => mem.displayName.toUpperCase() === string.toUpperCase());
		if (!find) find = message.guild.members.cache.get(string);
		if (!find) return undefined;
		else member = find;
	}
	
	if (!member) member = message.member;
	
	return {
		user: member.user,
		member: member
	};
};