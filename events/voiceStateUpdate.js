module.exports = (client, old, member) => {
	if (member.guild.voiceConnection && member.guild.voiceConnection.channel.members.size === 1) {
		member.guild.music = {};
		member.guild.voiceConnection.disconnect()
	}
};