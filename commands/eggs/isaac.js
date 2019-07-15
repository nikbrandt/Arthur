exports.run = async message => {
	await message.channel.send({files: ['https://cdn.discordapp.com/attachments/219218693928910848/362107357381263360/DKDppW_UQAAfVN2.jpg']});
	await message.channel.send({files: ['https://cdn.discordapp.com/attachments/219218693928910848/362107365224611852/DKDpsPKUIAEAbpB.jpg']});
	message.channel.send({files: ['https://cdn.discordapp.com/attachments/219218693928910848/362107376267952131/DKDpuoHU8AEPpyx.jpg']});
};

exports.config = {
	enabled: true,
	permLevel: 2,
	aliases: ['isaacology', 'eyesackology'],
	cooldown: 30000,
	perms: ['ATTACH_FILES'],
	category: 'eggs'
};

exports.meta = {
	command: 'isaac',
	name: 'Isaacology',
	description: 'Isaac\'s glorious command',
	usage: 'isaac',
	help: 'Isaac\'s glorious command'
};