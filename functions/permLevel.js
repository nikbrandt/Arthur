const { Permissions } = require('discord.js');

exports.pl = client => {
	client.permLevel = message => {
		let permLevel = 2;

		if (client.ownerId === message.author.id) return 10;
		if (client.config.owners.includes(message.author.id)) return 9;
		if (!message.author) return 0;
		if (!message.guild) return 1;

		try {
			let mod = message.guild.roles.cache.find(r => /mod$|moderator.*/.test(r.name.toLowerCase()));
			let admin = message.guild.roles.cache.find(r => r.name.toLowerCase().includes('admin'));
			if (mod && message.member.roles.cache.has(mod.id)) permLevel = 3;
			if (message.member.permissions.has(Permissions.FLAGS.MANAGE_GUILD)) permLevel = 4;
			if ((admin && message.member.roles.cache.has(admin.id)) || message.member.permissions.has('ADMINISTRATOR')) permLevel = 5;
		} catch (e) {}

		if (message.author.id === message.guild.ownerId) permLevel = 6;

		return permLevel;

		/*
		0 - not a person (webhook/pinned message)
		1 - in a DM
		2 - regular guild member
		3 - mod
		4 - admin
		5 - manage server perm
		6 - guild owner
		9 - bot owner
		10 - gymno
		*/
	};
};
