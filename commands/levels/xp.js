const sql = require('sqlite');
const XP = require('../../struct/xp.js');

exports.run = async (message, args, suffix, client) => {
	let guildRow = await sql.get(`SELECT * FROM guildOptions WHERE guildID = '${message.guild.id}'`);
	if (!guildRow || guildRow.levels === 'false') return;
	
	let memObj = client.findMember(message, suffix);
	let mem;
	if (!memObj) mem = message.member;
	else mem = memObj.member;
	
	let xpObj = await XP.memberXP(mem);
	let nextLevel = client.config.xp.levelOne * Math.pow(client.config.xp.mult, xpObj.level);
	let neededXP = Math.floor((nextLevel) - xpObj.current) * 10 / 10;
	let percent = Math.round(xpObj.current / nextLevel * 1000) / 10;
	
	let gRank = await XP.globalRank(mem.user);
	let rank = await XP.guildRank(mem);
	
	message.channel.send({embed: {
		author: {
			name: mem.displayName + '\'s XP',
			icon_url: mem.user.avatarURL
		},
		color: 0x8356ff,
		description: message.__('description', { xp: xpObj.global, end: gRank ? ' - ' + message.__('rank_on_page', { rank: gRank.rank, page: gRank.page }) : '' }),
		fields: [
			{
				name: message.__('guild_xp'),
				value: message.__('current_xp', { 
					current: xpObj.current,
					total: xpObj.current === xpObj.total ? '' : ', ' + message.__('total') + `: **${xpObj.total}**`,
					level: xpObj.level,
					rank: rank ? '\n' + message.__('rank') + `: **${rank.rank}**, ` + message.__('page') + `: **${rank.page}**.` : ''
				}),
				inline: true
			},
			{
				name: 'Progress',
				value: `[${':dollar:'.repeat(parseInt(percent.toString().slice(0, 1), 10))}${':yen:'.repeat(10 - parseInt(percent.toString().slice(0, 1), 10))}]\n**${neededXP}** ${message.__('xp_to_level')} ${xpObj.level + 1}. (${percent}%)`,
				inline: true
			}
		]
	}});
};

exports.config = {
	enabled: true,
	permLevel: 2,
	aliases: ['rank'],
	perms: ['EMBED_LINKS']
};

exports.help = {
	name: 'XP',
	description: 'Show your current XP and level',
	usage: 'xp',
	help: 'Show current, total, and global XP, your current level, and how close you are to leveling up.',
	category: 'Leveling and Profiles'
};