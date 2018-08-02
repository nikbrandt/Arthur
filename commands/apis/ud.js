const request = require('request');

exports.run = (message, a, suffix) => {
    if (message.guild && !message.channel.nsfw) return message.channel.send('Apparently the urban dictionary is NSFW. I know, it\'s annoying, just tryin\' to keep this bot afloat. (You can only use this command in NSFW channels)');
    request(`http://api.urbandictionary.com/v0/define?term=${suffix}`, (err, resp, body) => {
        if (err) return message.channel.send('Urban Dictionary is broken right now, dunno why, riperoni in pepperoni.');

        const hotBod = JSON.parse(body);
        if (!hotBod || hotBod.result_type === 'no_results') return message.channel.send('sir/ma\'am, the urban dictionary does not have a definition for your messed up word.');
        const choice = Math.floor(Math.random() * hotBod.list.length);
        const theChosenOne = hotBod.list[choice];

	    if (!theChosenOne) return message.channel.send('No results. None. Nada. Rip.');

        message.channel.send({embed: {
            color: 680000,
            title: theChosenOne.word,
            url: theChosenOne.permalink,
            fields: [
                {
                    name: 'Definition',
                    value: theChosenOne.definition,
                    inline: true
                },
                {
                    name: 'Example',
                    value: `*${theChosenOne.example}*`,
                    inline: true
                }
            ],
            footer: {
                text: `Authored by ${theChosenOne.author} | Ratings: +${theChosenOne.thumbs_up}, -${theChosenOne.thumbs_down}`
            }
        }}).catch(() => { message.channel.send('the definition was probably too long to fit in a message, sorry') });
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