const sql = require('sqlite');
const XP = require('../../functions/xp.js');

exports.run = async (message, args, suffix, client) => {
	let guildRow = await sql.get(`SELECT * FROM guildOptions WHERE guildID = '${message.guild.id}'`);
	if (!guildRow || guildRow.levels === 'false') return;
	
	let memObj = client.findMember(message, suffix);
	let mem;
	if (!memObj) mem = message.member;
	else mem = memObj.member;
	
	let xpObj = await XP.memberXP(mem);
	let nextLevel = client.config.xp.levelOne * Math.pow(client.config.xp.eqMult, xpObj.level);
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
		description: `**${xpObj.global}** global XP${gRank ? ` - Rank **${gRank.rank}**, on page **${gRank.page}**.` : '.'}`,
		fields: [
			{
				name: 'Guild XP',
				value: `Current: **${xpObj.current}**${xpObj.current === xpObj.total ? '' : `, Total: **${xpObj.total}**`}\nLevel: **${xpObj.level}**${rank ? `\nRank: **${rank.rank}**, Page: **${rank.page}**.` : ''}`,
				inline: true
			},
			{
				name: 'Progress',
				value: `[${':dollar:'.repeat(parseInt(percent.toString().slice(0, 1), 10))}${':yen:'.repeat(10 - parseInt(percent.toString().slice(0, 1), 10))}]\n**${neededXP}** XP to level ${xpObj.level + 1}. (${percent}%)`,
				inline: true
			}
		]
	}});
};

exports.config = {
	enabled: true,
	permLevel: 2,
	aliases: []
};

exports.help = {
	name: 'XP',
	description: 'Show your current XP and level',
	usage: 'xp',
	help: 'Show current, total, and global XP, your current level, and how close you are to leveling up.',
	category: 'Leveling and Profiles'
};