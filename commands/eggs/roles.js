exports.run = message => {
	message.channel.send(`**server roles**\n${message.guild.roles.cache.filter(r => r.name !== '@everyone').map(r => r.name).join(', ')}`);
};

exports.config = {
	enabled: true,
	permLevel: 2,
	category: 'eggs'
};

exports.meta = {
	command: 'roles',
	name: 'Roles',
	description: 'just lists roles',
	help: 'actually just lists roles? just for you shatterdpixel#6342 bb'
};