module.exports = (client, old, member) => {
	setTimeout(() => {
		if (member.guild.voice && member.guild.voice.connection && (member.guild.voice.connection.channel.members.size === 1 || !member.guild.voice.connection.channel.members.some(m => m.user.bot === false))) {
			member.guild.music = {};
			member.guild.voice.connection.disconnect();
		}
	}, 15000)
};