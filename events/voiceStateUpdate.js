module.exports = (client, old, member) => {
	setTimeout(() => {
		if (member.guild.voiceConnection && (member.guild.voiceConnection.channel.members.size === 1 || !member.guild.voiceConnection.channel.members.some(m => m.user.bot === false))) {
			member.guild.music = {};
			member.guild.voiceConnection.disconnect();
		}
	}, 15000)
};