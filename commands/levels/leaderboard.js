exports.run = (message, args, suffix, client) => {
	if (!client.guildTable.has(message.guild.id) || client.guildTable.get(message.guild.id).levels === false) return;
	switch (args[0]) {
		case 'server':
		case 'guild':
		case args[0] ? args[0].length === 18 || (args[0].length >= 1 && args[0].length <= 3) : undefined:
			let guildID = message.guild.id;
			
			if (client.config.owners.includes(message.author.id) && !!args[0] && args[0].length === 18) {
				let guild = client.guilds.get(args[0]);
				if (!guild) {
					message.channel.send('That\'s not a valid id.');
					guildID = message.guild.id;
				} else guildID = guild.id;
			}
			
			let page = 1;
			if (args[1] || args[0] ? args[0].length <= 3 : args[1]) {
				let tempPage = parseInt(args[0].length < 4 ? args[0] : args[1], 10);
				if (isNaN(tempPage)) return message.channel.send(`\`${args[0].length < 4 ? args[0] : args[1]}\` is not a valid page number.`);
				if (tempPage < 1) return message.channel.send('There is no page 0 or negative.');
				page = Math.floor(tempPage);
			}
			
			let rank = client.checkGuildRank(guildID, message.author.id);
			let list = client.guildLeaderboard(guildID, page);
			if (!list) return message.channel.send('Not enough people have talked to generate page ' + page + '.');
			let guild = client.guilds.get(guildID);
			
			message.channel.send({embed: {
				color: 0x8356ff,
				author: {
					name: guild.name,
					icon_url: guild.iconURL
				},
				footer: {text: `Viewing page ${page} of ${list.max}${!!rank ? ` | You are rank ${rank.rank}, on page ${rank.page}.` : ''}`},
				description: list.array.join('\n')
			}});
			
			break;
		case 'global':
		case 'g':
			let pg = 1;
			if (args[1]) {
				let tempPage = parseInt(args[1], 10);
				if (isNaN(tempPage)) return message.channel.send(`\`${args[1]}\` is not a valid page number.`);
				if (tempPage < 1) return message.channel.send('There is no page 0 or negative.');
				pg = Math.floor(tempPage);
			}
			
			let gRank = client.checkGlobalRank(message.author.id);
			let gList = client.globalLeaderboard(pg);
			if (!gList) return message.channel.send('Not enough people have talked to generate page ' + pg + '.');
			
			message.channel.send({embed: {
				author: {
					name: 'Global Leaderboard',
					icon_url: client.user.avatarURL
				},
				color: 0x8356ff,
				footer: {text: `Viewing page ${pg} of ${gList.max}${!!gRank ? ` | You are rank ${gRank.rank}, on page ${gRank.page}.` : ''}`},
				description: gList.array.join('\n')
			}});
			
			break;
	}
};

exports.config = {
	enabled: true,
	permLevel: 2,
	aliases: ['lb']
};

exports.help = {
	name: 'Leaderboard',
	description: 'Show the leaderboard for the current guild or global.',
	usage: 'leaderboard [global/server] [page]',
	help: 'Show either server or global leaderboard for XP. Select a page, if necessary.',
	category: 'Leveling and Profiles'
};