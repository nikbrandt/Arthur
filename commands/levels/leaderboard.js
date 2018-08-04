const sql = require('sqlite');
const XP = require('../../struct/xp.js');

exports.run = async (message, args, suffix, client) => {
	let guildRow = await sql.get(`SELECT * FROM guildOptions WHERE guildID = '${message.guild.id}'`);
	if (!guildRow || guildRow.levels === 'false') return;

	if (args[0] === message.__('server') || args[0] === message.__('guild') || args[0] === message.__('server_abbreviation') || !args[0] || (args[0].length > 0 && args[0].length < 4 && args[0] !== message.__('global_abbreviation')) || args[0].length === 19) {
		let guildID = message.guild.id;
		
		let page = 1;
		if (args[1] || args[0]) {
			if ((args[0] === message.__('server') || args[0] === message.__('guild') || args[0] === message.__('server_abbreviation')) && !args[1]) args[1] = '1';
			let tempPage = parseInt(args[0].length < 4 && args[0] !== message.__('server') && args[0] !== message.__('guild') && args[0] !== message.__('server_abbreviation') ? args[0] : args[1], 10);
			if (isNaN(tempPage)) return message.channel.send(message.__('invalid_page', { page: args[0].length < 4 ? args[0] : args[1] }));
			if (tempPage < 1) return message.channel.send(message.__('negative_or_zero_page'));
			page = Math.floor(tempPage);
		}
		
		let rank = await XP.guildRank(message.member);
		let list = await XP.guildLeaderboard(guildID, page, client);
		if (!list) return message.channel.send(message.__('not_enough_people', { page }));
		let guild = client.guilds.get(guildID);
		
		message.channel.send({embed: {
			color: 0x8356ff,
			author: {
				name: guild.name,
				icon_url: guild.iconURL
			},
			footer: { text: message.__('footer', { page, maxPage: list.max, end: !!rank ? ' | ' + message.__('footer_rank', { rank: rank.rank, page: rank.page }) : '' }) },
			description: list.array.join('\n')
		}});
	}
	
	if (args[0] === message.__('global') || args[0] === message.__('global_abbreviation')) {
		let pg = 1;
		if (args[1]) {
			let tempPage = parseInt(args[1], 10);
			if (isNaN(tempPage)) return message.channel.send(message.__('invalid_page', { page: args[0] }));
			if (tempPage < 1) return message.channel.send(message.__('negative_or_zero_page'));
			pg = Math.floor(tempPage);
		}
		
		let gRank = await XP.globalRank(message.author);
		let gList = await XP.globalLeaderboard(pg, client);
		if (!gList) return message.channel.send(message.__('not_enough_people', { page: pg }));
		
		message.channel.send({embed: {
			author: {
				name: message.__('global_leaderboard'),
				icon_url: client.user.avatarURL
			},
			color: 0x8356ff,
			footer: { text: message.__('footer', { page: pg, maxPage: gList.max, end: !!gRank ? ' | ' + message.__('footer_rank', { rank: gRank.rank, page: gRank.page }) : '' })},
			description: gList.array.join('\n')
		}});
	}
};

exports.config = {
	enabled: true,
	permLevel: 2,
	aliases: ['lb', 'lead', 'top'],
	perms: ['EMBED_LINKS']
};

exports.help = {
	name: 'Leaderboard',
	description: 'Show the leaderboard for the current guild or global.',
	usage: 'leaderboard [global/server] [page]',
	help: 'Show either server or global leaderboard for XP. Select a page, if necessary.',
	category: 'Leveling and Profiles'
};