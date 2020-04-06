const needle = require('needle');

exports.run = async message => {
	let resp = await needle('get', 'https://icanhazdadjoke.com/', { headers: { Accept: 'text/plain' } }).catch(() => {
		message.channel.send('Dad jokes failed. rip.');
	});
	
	if (resp) message.channel.send(resp.body);
};

exports.config = {
	enabled: true,
	permLevel: 1,
	aliases: [ 'ndya', 'wampler' ],
	perms: [ 'ATTACH_FILES' ],
	category: 'eggs'
};

exports.meta = {
	command: 'india',
	name: 'India',
	description: 'Dad jokes ftw',
	help: 'Dad jokes ftw'
};