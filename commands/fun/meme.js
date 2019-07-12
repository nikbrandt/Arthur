const request = require('request');

let subreddits = [ 'hmmm', 'dankmemes', 'memes', 'funny', 'grandayy', 'deepfriedmemes', 'dadjokes' ];

exports.run = (message) => {
  let randomSubreddit = subreddits[Math.floor(Math.random()*subreddits.length)];

	request(`https://imgur.com/r/${randomSubreddit}/hot.json`, (err, response, body) => {
		if (err) return message.channel.send(message.__('error'));
		let json;
		
		try {
			json = JSON.parse(body);
		} catch (e) {
			return message.channel.send(message.__('error'))
		}

		if (!json || !json.response || !json.response.data) return message.channel.send(message.__('error'));

    let randomPost = json.data[Math.floor(Math.random()*json.data.length)];

		message.channel.send({embed: {
      title: randomPost.title
      url: randomPost.reddit
			image: {
				url: `https://i.imgur.com/${randomPost.hash}${randomPost.ext}`
			},
			color: 0x00c140,
      footer: `Posted by u/${randomPost.author} on r/${randomSubreddit}`
		}})
	});
};

exports.config = {
	enabled: true,
	permLevel: 0,
	perms: [ 'EMBED_LINKS' ],
	category: 'fun'
};
