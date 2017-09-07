const ytdl = require('ytdl-core');

exports.run = async (message, args) => {
	if (!message.guild.music || !message.guild.music.queue) return message.channel.send(`There is no music queued. Add some with the \`play\` command.`);

	let i = 1;
	if (args[0]) {
		let parsed = parseInt(args[0]);
		if (!parsed) return message.channel.send('That\'s not a valid page number.');
		if (parsed < 1) return message.channel.send('There aren\'t negative pages.');
		parsed = Math.floor(parsed);
		if ((parsed - 1) * 10 > message.guild.music.queue.length) return message.channel.send(`There ${message.guild.music.queue.length < 11 ? 'is' : 'are'} only ${Math.ceil(message.guild.music.queue.length / 10)} page${message.guild.music.queue.length < 11 ? '' : 's'} in the queue.`);
		i = (parsed - 1) * 10 + 1;
	}

	let pars = i;
	let songArray = [];
	let queue = message.guild.music.queue;

	function iterate () {
		let obj = queue[i - 1];

		if (i !== 1) songArray.push(`${i}. ${obj.meta.queueName}`);

		i++;
		if (i <= pars + 9 && i <= queue.length) iterate();
		else message.channel.send('', {embed: {
			title: queue[0].meta.title,
			description: songArray.join('\n'),
			color: 0x427df4,
			footer: {
				text: `Page ${Math.ceil(pars / 10)} of ${Math.ceil(message.guild.music.queue.length / 10)} | ${message.guild.music.queue.length} Song${message.guild.music.queue.length === 1 ? '' : 's'} Total`
			}
		}});
	}

	iterate();

	/*
	let msg = await message.channel.send('Loading..');
	await fuckQueue();

	async function fuckQueue () {
		let obj = queue[i - 1];

		if (i !== 1) {
			if (obj.type === 1) {
				let info = await ytdl.getInfo(obj.id);
				let secObj = secSpread(info.length_seconds);
				songArray.push(`${i}. [${info.title}](https://youtu.be/${obj.id}) - ${secObj.h ? `${secObj.h}h ` : ''}${secObj.m ? `${secObj.m}m ` : ''}${secObj.s}s`);
			} else if (obj.type === 2) {
				songArray.push(`${i}. A [file](${obj.id}) provided by ${obj.person.tag}.`)
			}
		}

		i++;

		if (i <= pars + 9 && i < queue.length) fuckQueue().catch(console.error);
		else finishQueue();
	}

	async function finishQueue() {
		let npInfo;
		let npSec;
		let title;

		if (message.guild.music.queue[0].type === 1) {
			npInfo = await ytdl.getInfo(message.guild.music.queue[0].id);
			npSec = secSpread(npInfo.length_seconds);
			title = `Now playing: ${npInfo.title} (${npSec.h ? `${npSec.h}h ` : ''}${npSec.m ? `${npSec.m}m ` : ''}${npSec.s}s)`;
		} else if (message.guild.music.queue[0].type === 2) {
			title = `Now playing: A file provided by ${message.guild.music.queue[0].person.tag}.`;
		}

		msg.edit('', {embed: {
			title: title,
			description: songArray.join('\n'),
			color: 0x427df4,
			footer: {
				text: `Page ${Math.ceil(pars / 10)} of ${Math.ceil(message.guild.music.queue.length / 10)} | ${message.guild.music.queue.length} Song${message.guild.music.queue.length === 1 ? '' : 's'} Total`
			}
		}});
	}
	*/
};

exports.config = {
	enabled: true,
	permLevel: 2,
	aliases: ['queueueue', 'queueue', 'que', 'qu', 'q'],
	perms: ['EMBED_LINKS']
};

exports.help = {
	name: 'Queue',
	description: 'View the current queue',
	usage: 'queue <page>',
	help: 'View the current queue. View a different page if there are more than 10 songs.',
	category: 'Music'
};