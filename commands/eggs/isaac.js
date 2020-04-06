const { createCanvas, loadImage } = require('canvas');

exports.run = async (message, args, suffix, client) => {
	const canvas = createCanvas(250, 250);
	const ctx = canvas.getContext('2d');
	
	let userImage;
	let obj = client.findMember(message, suffix);
	if (obj) userImage = obj.user;
	else userImage = message.author;
	
	userImage = await loadImage(userImage.displayAvatarURL({ format: 'png' }));
	
	ctx.drawImage(userImage, 0, 0, 250, 250);
	
	ctx.rotate(-Math.PI / 4);
	ctx.fillStyle = '#f00';
	ctx.font = '130px RobotoMedium';
	ctx.fillText('Yikes', -150, 250);

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