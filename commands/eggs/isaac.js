const { createCanvas, loadImage, registerFont } = require('canvas');

exports.run = async (message) => {
	const canvas = createCanvas(250, 250);
	const ctx = canvas.getContext('2d');
	
	let userImage = await loadImage(message.author.displayAvatarURL({ format: 'png' }));
	
	ctx.drawImage(userImage, 0, 0, 250, 250);
	
	ctx.rotate(-Math.PI / 4);
	ctx.fillStyle = '#f00';
	ctx.font = '130px RobotoMedium';
	ctx.fillText('Yikes', -150, 250);

	message.channel.send({ files: [{ attachment: canvas.toBuffer(), name: 'hug.png' }] });
};

exports.config = {
	enabled: true,
	permLevel: 1,
	perms: ['ATTACH_FILES'],
	category: 'eggs'
};

exports.meta = {
	command: 'isaac',
	name: 'Isaac',
	description: 'Yikes.',
	usage: 'isaac',
	help: 'Yikes.'
};