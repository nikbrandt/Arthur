const Canvas = require('canvas');
const fs = require('fs');
const request = require('request');

exports.run = (message, args, suffix, client) => {
	let receiverURL;

	if (args[0]) {
		let obj = client.findMember(message, suffix);
		if (!obj) receiverURL = 'https://i.imgur.com/PO6OvAH.png'; // arthur pfp but specialized
		else receiverURL = obj.user.displayAvatarURL;
	} else receiverURL = 'https://i.imgur.com/PO6OvAH.png';

	const Image = Canvas.Image,
		canvas = new Canvas(300, 350),
		ctx = canvas.getContext('2d');

	let counter = 0;
	let backgroundImageFile;
	let receiverImageFile;
	let giverImageFile;

	request.get(receiverURL)
		.pipe(fs.createWriteStream(`../media/temp/r${message.id}.png`))
		.on('finish', () => {
			fs.readFile(`../media/temp/r${message.id}.png`, (err, image) => {
				receiverImageFile = image;
				counter++;
				complete();
			})
		});

	request.get(message.author.displayAvatarURL)
		.pipe(fs.createWriteStream(`../media/temp/g${message.id}.png`))
		.on('finish', () => {
			fs.readFile(`../media/temp/g${message.id}.png`, (err, image) => {
				giverImageFile = image;
				counter++;
				complete();
			})
		});

	fs.readFile('../media/images/hug.png', (err, image) => {
		backgroundImageFile = image;
		counter++;
		complete();
	});

	function complete() {
		if (counter !== 3) return;

		let backgroundImage = new Image;
		backgroundImage.src = backgroundImageFile;
		ctx.drawImage(backgroundImage, 0, 0);

		let receiverImage = new Image;
		receiverImage.src = receiverImageFile;
		ctx.save();
		ctx.translate(35, 20);
		ctx.rotate(-8 * Math.PI / 180);
		ctx.drawImage(receiverImage, 0, 0, 110, 110);
		ctx.restore();

		let giverImage = new Image;
		giverImage.src = giverImageFile;
		ctx.save();
		ctx.translate(155, 15);
		ctx.rotate(6 * Math.PI / 180);
		ctx.drawImage(giverImage, 0, 0, 110, 110);

		fs.unlinkSync(`../media/temp/r${message.id}.png`);
		fs.unlinkSync(`../media/temp/g${message.id}.png`);

		message.channel.send({ files: [{ attachment: canvas.toBuffer(), name: 'hug.png' }] });
	}
};

exports.config = {
	enabled: true,
	permLevel: 2,
	aliases: []
};

exports.help = {
	name: 'Hug',
	description: 'Hug Arthur (or someone else)',
	usage: 'hug [person]',
	help: 'Hug someone, whether it be Arthur or that guy that wants a hug.',
	category: 'Fun'
};