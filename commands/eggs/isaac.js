const { createCanvas, loadImage } = require('canvas');

exports.run = async (message, args, suffix, client) => {
	const canvas = createCanvas(2048, 2048);
	const ctx = canvas.getContext('2d');

	let userImage;
	let obj = client.findMember(message, suffix);
	if (obj) userImage = obj.user;
	else userImage = message.author;

	userImage = await loadImage(userImage.displayAvatarURL({ format: 'png', size: 2048 }));

	ctx.drawImage(userImage, 0, 0, 2048, 2048);

	ctx.rotate(-Math.PI / 4);
	ctx.fillStyle = '#f00';
	ctx.font = '1065px RobotoMedium';
	ctx.fillText('Yikes', -1229, 2048);

	message.channel.send({ files: [{ attachment: canvas.toBuffer(), name: 'yikes.png' }] });
};

exports.config = {
	enabled: true,
	permLevel: 1,
	perms: [ 'ATTACH_FILES' ],
	aliases: [ 'yikes' ],
	category: 'eggs'
};

exports.meta = {
	command: 'isaac',
	name: 'Isaac',
	description: 'Yikes.',
	usage: '[user]',
	help: 'Yikes.'
};
