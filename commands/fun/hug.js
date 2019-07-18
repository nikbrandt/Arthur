const { createCanvas, loadImage } = require('canvas');

exports.run = async (message, args, suffix, client) => {
	let receiverURL = '../media/images/hugArthur.png';

	if (args[0]) {
		let obj = client.findMember(message, suffix);
		if (obj) receiverURL = obj.user.displayAvatarURL;
	}

	const canvas = createCanvas(300, 350);
	const ctx = canvas.getContext('2d');

	let [ receiverImage, giverImage, backgroundImage ] = await Promise.all([
		loadImage(receiverURL),
		loadImage(message.author.displayAvatarURL),
		loadImage('../media/images/hug.png')
	]);
	
	ctx.drawImage(backgroundImage, 0, 0);

	ctx.save();
	ctx.translate(35, 20);
	ctx.rotate(-8 * Math.PI / 180);
	ctx.drawImage(receiverImage, 0, 0, 110, 110);
	ctx.restore();
	
	ctx.translate(155, 15);
	ctx.rotate(-352 * Math.PI / 180);
	ctx.drawImage(giverImage, 0, 0, 110, 110);

	message.channel.send({ files: [{ attachment: canvas.toBuffer(), name: 'hug.png' }] });
};

exports.config = {
	enabled: true,
	permLevel: 2,
	category: 'fun'
};