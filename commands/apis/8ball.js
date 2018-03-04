const request = require('request');

exports.run = (message) => {
	request('https://8ball.delegator.com/magic/JSON/am%20i%20naked', (err, resp, body) => {
		if (err) return console.log(`Got an error with an 8ball request (status code ${resp.statusCode}):\n${err.stack}`);
		message.channel.send(`:8ball: ${JSON.parse(body).magic.answer}`);
	});
};

exports.config = {
	enabled: true,
	permLevel: 1,
	aliases: ['9ball', '7ball', 'ball', 'eightball']
};

exports.help = {
	name: 'Eight Ball',
	description: 'Ask the *magical eight ball* a question.',
	usage: '8ball [question]',
	help: 'Ask the *magical eight ball* a question. Not much to it.',
	category: 'APIs'
};