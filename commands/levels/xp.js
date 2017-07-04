exports.run = (message, args, suffix, client) => {
	if (!client.guildTable.has(message.guild.id) || client.guildTable.get(message.guild.id).levels === false) return;
	
	let memObj = client.findMember(message, suffix);
	let mem;
	if (!memObj) mem = message.member;
	else mem = memObj.member;
	
	let xpObj = client.memberXP(mem);
	let guildXP = xpObj[message.guild.id];
	let nextLevel = client.config.xp.levelOne * Math.pow(client.config.xp.eqMult, guildXP.level);
	let neededXP = Math.floor((nextLevel) - guildXP.currentXP) * 10 / 10; 
	let percent = Math.round(guildXP.currentXP / nextLevel * 1000) / 10;
	
	let gRank = client.checkGlobalRank(mem.user.id);
	let rank = client.checkGuildRank(message.guild.id, mem.user.id);
	
	message.channel.send({embed: {
		author: {
			name: mem.displayName + '\'s XP',
			icon_url: mem.user.avatarURL
		},
		color: 0x8356ff,
		description: `**${xpObj.global}** global XP${gRank ? ` - Rank **${gRank.rank}**, on page **${gRank.page}**.` : '.'}`,
		fields: [
			{
				name: 'XP',
				value: `Current: **${guildXP.currentXP}**${guildXP.currentXP === guildXP.totalXP ? '' : `, Total: **${guildXP.totalXP}**`}\nLevel: **${guildXP.level}**${rank ? `\nRank: **${rank.rank}**, Page: **${rank.page}**.` : ''}`,
				inline: true
			},
			{
				name: 'Progress',
				value: `[${':dollar:'.repeat(parseInt(percent.toString().slice(0, 1), 10))}${':yen:'.repeat(10 - parseInt(percent.toString().slice(0, 1), 10))}]\n**${neededXP}** XP to level ${guildXP.level + 1}. (${percent}%)`,
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