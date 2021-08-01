const util = require('util');
const { exec } = require('child_process');

function errorMessage (channel, error) {
	let errorContent = `**Input above.**\n\n❗Error:\n\`\`\`shell\n${error}\n\`\`\``;
	channel.send(errorContent);
}

function successMessage(channel, text) {
	let sliceAmount = 0;
	if (text.length > 1800) sliceAmount = text.length - 1800;
	text = text.replace(/`/g, '\\`');

	let successContent = `**Input above.** \n\n🎉 Success\n\`\`\`js\n${sliceAmount ? text.slice(0, -sliceAmount) : text}\n\`\`\`${sliceAmount ? `\n*Trimmed ${sliceAmount.toString().length > 20 ? 'a lot of' : sliceAmount.toString()} characters*` : ''}`;

	channel.send(successContent);
}

exports.run = async (message, args, suffix, client) => {
	if (!client.config.owners.includes(message.author.id)) return;
	if (!suffix) return message.channel.send('I need something to eval!');

	exec(suffix.replace(/(\n)?```(js|shell|bash)?(\n)?/g, ''), (error, stdout, stderr) => {
		if (error || stderr)
			return errorMessage(message.channel, error ? error.message : stderr);

		successMessage(message.channel, stdout);
	});
};

exports.config = {
	enabled: true,
	permLevel: 10,
	category: 'developer'
};
