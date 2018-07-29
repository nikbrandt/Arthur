const util = require('util');

function errorMessage (silent, channel, error, message) {
	if (silent) return;
	let errorContent = `**Input above.**\n\n❗Error:\n\`\`\`js\n${error}\n\`\`\``;
	
	if (message) message.edit(errorContent);
	else channel.send(errorContent);
}

async function successMessage(silent, channel, text, message) {
	if (silent) return 'no';
	let sliceAmount = 0;
	if (text.length > 1850) sliceAmount = text.length - 1850;
	text = text.replace(/`/g, '\\`');
	
	let successContent = `**Input above.** \n\n🎉 Success\n\`\`\`js\n${sliceAmount ? text.slice(0, -sliceAmount) : text}\n\`\`\`${sliceAmount ? `\n*Trimmed ${sliceAmount.toString().length > 20 ? 'a lot of' : sliceAmount.toString()} characters*` : ''}`;
	
	if (message) message.edit(successContent);
	else return await channel.send(successContent);
}

exports.run = async (message, args, suffix, client) => {
	if (!client.config.owners.includes(message.author.id)) return;
	if (!suffix) return message.channel.send('I need something to eval!');

	let evaled;
	let response;
	let msg;
	let silent = false;
	
	if (suffix.toLowerCase().includes('-s') || suffix.toLowerCase().includes('--silent')) {
		suffix = suffix.replace(/ *--?s(ilent)? */i, '');
		silent = true;
	}

	function awaitMsg (callback, i) {
		if (!i) i = 0;
		if (i > 20) return;

		if (msg) {
			if (msg !== 'no') callback();
		} else setTimeout(() => {
			awaitMsg(callback, i++)
		}, 1000);
	}
	
	try {
		evaled = eval(suffix.replace(/(\n)?```(js)?(\n)?/g, ''));
	} catch (err) {
		return errorMessage(silent, message.channel, err.toString());
	}
	
	if (evaled && typeof evaled.then === 'function' && typeof evaled.catch === 'function') {
		response = 'Promise <Pending>';
		
		evaled.then(res => {
			awaitMsg(() => { successMessage(silent, null, 'Promise <Resolved>\n' + util.inspect(res), msg).catch(() => {}) });
		});
		
		evaled.catch(err => {
			awaitMsg(() => { errorMessage(silent, null, err.toString(), msg) });
		});
	} else response = util.inspect(evaled);
	
	msg = await successMessage(silent, message.channel, response);
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