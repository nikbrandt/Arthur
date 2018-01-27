const request = require('request');
const fs = require('fs');
const util = require('util');

exports.run = (message, args, suffix, client, permLevel) => {
	const options = {
		url: 'https://rokket.space/upload?output=text',
		method: 'POST',
		headers: {
			'User-Agent': 'Arthur Discord Bot (github.com/Gymnophoria/Arthur)'
		},
		formData: {
			"files[]": fs.createReadStream('../../../../Downloads/wastedworry.wav')
		}
	};

	request(options, (err, res, body) => {
		console.log(`error: \n${err}\n\nresponse:\n${util.inspect(res)}\n\nbody:\n${body}`);
	});
};

exports.config = {
	enabled: true,
	permLevel: 9,
	aliases: []
};

exports.help = {
	name: 'Test',
	description: 'Arthur\'s latest test command',
	usage: 'test [nobody knows]',
	help: 'Arthur\'s latest test command; too bad you can\'t use it.',
	category: 'Developer'
};