const util = require('util');

exports.run = (message, args, suffix, client) => {
	if (!client.config.owners.includes(message.author.id)) return;
	if (!suffix) return message.channel.send('I need something to eval!')
	
	let evaled;
	let sliceAm = 0;
	
	try {
		evaled = util.inspect(eval(suffix));
	} catch (err) {
		return message.channel.send(`**Input above.**\n\n❗Error:\n\`\`\`js\n${err}\n\`\`\``);
	}
	
	if (evaled.length > 1900) sliceAm = evaled.length - 1900;
	
	message.channel.send(`**Input above.** \n\n🎉 Success\n\`\`\`js\n${sliceAm ? evaled.slice(0, -sliceAm) : evaled}\n\`\`\`${sliceAm ? '\n*Trimmed ' + sliceAm + ' /characters*' : ''}`);
};

exports.config = {
	enabled: true,
	permLevel: 10,
	aliases: []
};

exports.help = {
	name: 'Eval',
	description: 'Evaluate a thing. Confuse everyone.',
	usage: 'eval <statement>',
	help: 'C\'mon, you know how to use this.',
	category: 'Developer'
};