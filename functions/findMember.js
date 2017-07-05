module.exports = client => {
	client.findMember = (message, string) => {
		let member;
		if (message.mentions.members.first()) member = message.mentions.members.first();
		else if (!!string) {
			let find = message.guild.members.find(mem => mem.user.tag.toUpperCase() === string.toUpperCase());
			if (!find) find = message.guild.members.find(mem => mem.user.username.toUpperCase() === string.toUpperCase());
			if (!find) find = message.guild.members.find(mem => mem.displayName.toUpperCase() === string.toUpperCase());
			if (!find) return undefined;
			else member = find;
		} else member = message.member;
		return {
			user: member.user,
			member: member
		};
	};
};