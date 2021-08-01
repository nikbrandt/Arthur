const request = require('request');
const requestPromise = require('request-promise');

const linkRegex = /\[(.+?)]/g;
const inlineRegex = /\[([^[]*?)]?(\([^[]*?( ?"?[^[]*?)?)?([^)])$/;

async function asyncForEach(array, callback) {
	for (let index = 0; index < array.length; index++) {
		await callback(array[index], index, array)
	}
}

async function getDefinition (term) {
	let body;
	try {
		body = await requestPromise(`http://api.urbandictionary.com/v0/define?term=${encodeURIComponent(term)}`);
		body = JSON.parse(body);
	} catch (e) {
		return 'No definition found.';
	}

	if (!body || body.result_type === 'no_results' || !body.list || !body.list[0] || !body.list[0].definition) return 'No definition found.';
	return sliceIfTooBig(body.list[0].definition.replace(linkRegex, '$1'), 100, true);
}

function sliceIfTooBig(string, num, elipsis, beautify) {
	if (string.length > num) {
		string = string.slice(0, -(string.length - num));
		if (beautify) {
			if (inlineRegex.test(string)) string = string.replace(inlineRegex, '$1');
		}
		if (elipsis) string = string + '...';
	}
	return string;
}

exports.run = async (message, a, suffix) => {
	if (message.guild && !message.channel.nsfw) return message.channel.send(message.__('nsfw'));
	request(`http://api.urbandictionary.com/v0/${suffix ? `define?term=${encodeURIComponent(suffix)}` : 'random'}`, async (err, resp, body) => {
		if (err) return message.channel.send(message.__('not_connected'));

		let hotBod;
		try {
			hotBod = JSON.parse(body);
		} catch (e) {
			return message.channel.send(message.__('no_results'));
		}
		if (!hotBod || hotBod.result_type === 'no_results') return message.channel.send(message.__('no_results'));
		const theChosenOne = hotBod.list[0];

	    if (!theChosenOne) return message.channel.send(message.__('no_results'));

	    let definition = theChosenOne.definition;
	    let defMatches = definition.match(linkRegex);
	    if (defMatches) await asyncForEach(defMatches, async match => {
	    	let subDefinition = await getDefinition(encodeURIComponent(match.slice(1).slice(0, -1)));
	    	definition = definition.replace(match, `${match}(https://www.urbandictionary.com/define.php?term=${encodeURIComponent(match.slice(1).slice(0, -1))} "${subDefinition}")`);
	    });

	    let example = theChosenOne.example;
	    let exampleMatches = example.match(linkRegex);
	    if (exampleMatches) await asyncForEach(exampleMatches, async match => {
	    	let subDefinition = await getDefinition(encodeURIComponent(match.slice(1).slice(0, -1)));
	    	example = example.replace(match, `${match}(https://www.urbandictionary.com/define.php?term=${encodeURIComponent(match.slice(1).slice(0, -1))} "${subDefinition}")`);
	    });

        message.channel.send({embed: {
            color: 0x0095d1,
            title: theChosenOne.word,
            url: theChosenOne.permalink,
            fields: [
                {
                    name: message.__('definition'),
                    value: sliceIfTooBig(definition, 1021, true, true)
                },
                {
                    name: message.__('example'),
                    value: '*' + sliceIfTooBig(example, 1019, true, true) + '*'
                }
            ],
            footer: {
                text: message.__('footer', { author: theChosenOne.author, thumbsup: theChosenOne.thumbs_up, thumbsdown: theChosenOne.thumbs_down })
            }
        }}).catch(e => { console.log(e); message.channel.send(message.__('catch')) });
    });
};

exports.config = {
    enabled: true,
    permLevel: 1,
	category: 'apis'
};
