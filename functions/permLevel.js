exports.pl = client => {
	client.permLevel = message => {
		let permLevel = 2;
		
		if (client.owner.id === message.author.id) return 10;
		if (client.config.owners.includes(message.author.id)) return 9;
		if (!message.author) return 0;
		if (!message.guild) return 1;
		
		try {
			let mod = message.guild.roles.find(r => /mod$|moderator.*/.test(r.name.toLowerCase()));
			let admin = message.guild.roles.find(r => r.name.toLowerCase().includes('admin'));
			if (message.member.permissions.has('MANAGE_GUILD')) permLevel = 4;
			if (mod && message.member.roles.has(mod)) permLevel = 3;
			if ((admin && message.member.roles.has(admin)) || message.member.hasPermission('ADMIN')) permLevel = 5;
		} catch (e) {}
		
		if (message.author.id === message.guild.ownerID) permLevel = 6;
		
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

exports.numMapping = {
	0: '**Anyone** can use this command.',
	1: '**Anyone** can use this command.',
	2: 'This command can be used by **anyone in a server**',
	3: 'Only people with a **Mod role** can use this command.',
	4: 'Only people with the **Manage Server permission** or higher can use this command.',
	5: 'Only people with an **Admin role** or with the **Admin permission** can use this command.',
	6: 'Only the **server owner** can use this command.',
	10: 'Only **bot developers** can use this command.'
};