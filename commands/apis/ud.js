const request = require('request');

const linkRegex = /\[.+]/g;

exports.run = (message, a, suffix) => {
    if (message.guild && !message.channel.nsfw) return message.channel.send(message.__('nsfw'));
    request(`http://api.urbandictionary.com/v0/${suffix ? `define?term=${suffix}` : 'random'}`, (err, resp, body) => {
        if (err) return message.channel.send(message.__('not_connected'));

        const hotBod = JSON.parse(body);
        if (!hotBod || hotBod.result_type === 'no_results') return message.channel.send(message.__('no_results'));
        const theChosenOne = hotBod.list[0];

	    if (!theChosenOne) return message.channel.send(message.__('no_results'));
	    
	    let definition = theChosenOne.definition;
	    let defMatches = definition.match(linkRegex);
	    if (defMatches) defMatches.forEach(match => {
	    	definition = definition.replace(match, `${match}(https://www.urbandictionary.com/define.php?term=${encodeURIComponent(match.slice(1).slice(0, -1))})`);
	    });
	    
	    let example = theChosenOne.example;
	    let exampleMatches = example.match(linkRegex);
	    if (exampleMatches) exampleMatches.forEach(match => {
	    	example = example.replace(match, `${match}(https://www.urbandictionary.com/define.php?term=${encodeURIComponent(match.slice(1).slice(0, -1))})`);
	    });
	    
        message.channel.send({embed: {
            color: 0x134FE6,
            title: theChosenOne.word,
            url: theChosenOne.permalink,
            fields: [
                {
                    name: message.__('definition'),
                    value: definition,
                    inline: true
                },
                {
                    name: message.__('example'),
                    value: '*' + example + '*',
                    inline: true
                }
            ],
            footer: {
                text: message.__('footer', { author: theChosenOne.author, thumbsup: theChosenOne.thumbs_up, thumbsdown: theChosenOne.thumbs_down })
            }
        }}).catch(() => { message.channel.send(message.__('catch')) });
    });
};

exports.config = {
    enabled: true,
    permLevel: 1,
    aliases: ['urbandictionary', 'urbandict']
};
    
exports.help = {
    name: 'Urban Dictionary',
    description: 'Define a word or phrase using the glorious urban dictionary',
    usage: 'ud <phrase>',
    help: 'Define any word or phrase you so desire using the glorious power of the internet.',
    category: 'APIs'
};