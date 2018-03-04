const Canvas = require('canvas');
const moment = require('moment');
const os = require('os');

function sort (array) {
	array.sort((a, b) => {
		return a - b;
	});

	return array;
}

function sortKeys (object) {
	let keys = Object.keys(object);
	keys.sort((a, b) => {
		return object[a] - object[b]
	});

	return keys;
}

function reverse (array) {
	let reversed = [];

	array.forEach(i => {
		reversed.unshift(i);
	});

	return reversed;
}

exports.run = (message, args, suffix, client) => {
	let object;

	if (args[0] === 'weekly') {
		if (!client.weeklyStatsObject[moment().format('W/YYYY')]) return message.channel.send('Not enough commands have been used, somehow');
		object = client.weeklyStatsObject[moment().format('W/YYYY')];
	} else if (args[0] === 'daily') {
		if (!client.dailyStatsObject[moment().format('M/D/YYYY')]) return message.channel.send('Not enough commands have been used, apparently');
		object = client.dailyStatsObject[moment().format('M/D/YYYY')];
	} else {
		let keys = Object.keys(client.commandStatsObject);
		let values = Object.values(client.commandStatsObject);
		let temp = {};

		for (let i = 0; i < keys.length; i++) {
			temp[keys[i]] = values[i].uses;
		}

		object = temp;
	}

	let commandsArray = reverse(sortKeys(object));
	let usesArray = reverse(sort(Object.values(object)));

	let barMaxHeight = 275;

	const Font = Canvas.Font,
		canvas = new Canvas(1050, 450),
		ctx = canvas.getContext('2d');

	let barWidth = Math.floor(700 / commandsArray.length);
	if (barWidth > 35) barWidth = 35;
	let curWidth = 15;
	let heightMult = barMaxHeight / usesArray[0];
	let accent = '#00c140';

	ctx.fillStyle = accent; // add fonts, set color
	ctx.addFont(new Font('RobotoLight', '../media/fonts/Roboto-Light.ttf'));
	ctx.addFont(new Font('RobotoMedium', '../media/fonts/Roboto-Medium.ttf'));
	ctx.font = `${barWidth}px RobotoLight`;

	for (let i = 0; i < commandsArray.length; i++) { // generate each bar of graph w/ command name
		let height =  Math.floor(usesArray[i] * heightMult);
		ctx.fillRect(curWidth, canvas.height - height, barWidth, height);

		let numTop = ctx.measureText(usesArray[i]).width + 6 > height;

		ctx.save();
		ctx.translate(curWidth + barWidth - 6, canvas.height - height - 3); //  + ctx.measureText(commandsArray[i]).width
		ctx.rotate(-Math.PI / 2.5);
		ctx.fillStyle = '#fff';
		let string = commandsArray[i];
		if (numTop) string += ` - ${usesArray[i]}`;
		ctx.fillText(string, 0, 0);
		ctx.restore();

		if (!numTop) {
			ctx.save();
			ctx.translate(curWidth + barWidth - 3, canvas.height - 4);
			ctx.rotate(-Math.PI / 2);
			ctx.fillStyle = '#fff';
			ctx.fillText(usesArray[i], 0, 0);
			ctx.restore();
		}

		curWidth += barWidth + 4;
	}

	curWidth = 100; // show guild/user amounts
	ctx.font = '50px RobotoMedium';
	ctx.fillText(client.guilds.size.toString(), curWidth, 70);
	curWidth += ctx.measureText(client.guilds.size.toString()).width;
	ctx.font = '50px RobotoLight';
	ctx.fillText(' servers     ', curWidth, 70);
	curWidth += ctx.measureText(' servers     ').width;
	ctx.font = '50px RobotoMedium';
	ctx.fillText(client.users.size.toString(), curWidth, 70);
	curWidth += ctx.measureText(client.users.size.toString()).width;
	ctx.font = '50px RobotoLight';
	ctx.fillText(' users', curWidth, 70);

	let text;
	switch(args[0]) {
		case 'daily':
			text = moment().format('MMM Do YYYY');
			break;
		case 'weekly':
			text = moment().format('wo [week of] YYYY');
			break;
		default:
			text = 'All time';
			break;
	}
	curWidth = 800 - ctx.measureText(text).width;
	ctx.font = '40px RobotoLight';
	ctx.fillText(text, curWidth, 150);

	let lastEnd = -1.57; // RAM pie chart
	let mem = process.memoryUsage().rss * 1.0e-6;
	let total = 3000;
	let data = [mem, total - mem];
	let colors = ['#fff', accent];

	for (let i = 0; i < data.length; i++) {
		ctx.fillStyle = colors[i];
		ctx.beginPath();
		ctx.moveTo(925, 75);
		ctx.arc(925, 75, 70, lastEnd, lastEnd + (Math.PI * 2 * (data[i] / total)), false);
		ctx.lineTo(925, 75);
		ctx.fill();
		lastEnd += Math.PI * 2 * (data[i] / total);
	}

	lastEnd = -1.57; // CPU pie chart
	let cpu = os.loadavg()[1];
	data = [cpu, 100 - cpu];
	total = 100;

	for (let i = 0; i < 2; i++) {
		ctx.fillStyle = colors[i];
		ctx.beginPath();
		ctx.moveTo(925, 375);
		ctx.arc(925, 375, 70, lastEnd, lastEnd + (Math.PI * 2 * (data[i] / total)), false);
		ctx.lineTo(925, 375);
		ctx.fill();
		lastEnd += Math.PI * 2 * (data[i] / total);
	}

	ctx.fillStyle = accent; // RAM and CPU amounts
	ctx.font = '50px RobotoMedium';
	ctx.textAlign = 'center';
	ctx.fillText(`${mem.toFixed(1)} MB`, 925, 195);
	ctx.fillText(`${cpu.toFixed(2)}%`, 925, 290);

	ctx.textBaseline = 'middle'; // RAM and CPU labels
	ctx.font = '50px RobotoLight';
	ctx.globalCompositeOperation = 'xor';
	ctx.beginPath();
	ctx.fillText('RAM', 925, 75);
	ctx.fillText('CPU', 925, 375);
	ctx.fill();

	message.channel.send({ files: [{ attachment: canvas.toBuffer(), name: 'stats.png' }] });
};

exports.config = {
	enabled: true,
	permLevel: 2,
	aliases: []
};

exports.help = {
	name: 'Command Stats',
	description: 'View command stats of the bot.',
	usage: 'stats [total/weekly/daily]',
	help: 'View statistics on commands used, defaults to total.',
	category: 'Developer'
};