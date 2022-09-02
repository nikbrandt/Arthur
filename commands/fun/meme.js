const request = require('request');

const MAX_AGE = 1000 * 60 * 15; // maximum subreddit cache age, in ms
const subreddits = [ 'hmmm', 'dankmemes', 'memes', 'funny', 'deepfriedmemes', 'dadjokes', 'wholesomememes', 'meirl', 'me_irl', '2meirl4meirl' ];

// two properties:
//      lastUpdate: last time (from Date.now()) that subreddit was updated
//      data: subreddit data from request, parsed
let subredditCache = {};

function updateSubreddit(subreddit) {
	return new Promise((resolve, reject) => {
		if (subredditCache[subreddit] && Date.now() - subredditCache[subreddit].lastUpdate < MAX_AGE) return resolve();

		request(`https://imgur.com/r/${subreddit}/hot.json`, (err, response, body) => {
			if (err) return reject();
			let json;

			try {
				json = JSON.parse(body);
			} catch (e) {
				return reject();
			}

			if (!json || !json.data || !json.data[0]) return reject();

			json.data = json.data.filter(data => {
				return !data.nsfw && data.num_images >= 1 && data.mimetype && data.mimetype.startsWith('image');
			});

			if (json.data.length < 1) return reject();

			subredditCache[subreddit] = {
				data: json.data,
				lastUpdate: Date.now()
			};

			resolve();
		});
	});
}

function getSubredditMeme(subreddit) {
	return new Promise((resolve, reject) => {
		updateSubreddit(subreddit).then(() => {
			let { data } = subredditCache[subreddit];

			resolve(data[Math.floor(Math.random() * data.length)]);
		}).catch(reject);
	});
}

exports.run = (message, args) => {
	let subreddit = args[0] && subreddits.includes(args[0].toLowerCase())
		? args[0].toLowerCase()
		: subreddits[Math.floor(Math.random() * subreddits.length)];

	getSubredditMeme(subreddit).then(meme => {
		message.channel.send({embeds: [{
				title: meme.title,
				url: 'https://reddit.com' + meme.reddit,
				image: {
					url: `https://i.imgur.com/${meme.hash}${meme.ext}`
				},
				color: 0x00c140,
				footer: {
					text: `Posted by u/${meme.author} on r/${subreddit}`
				}
			}]})
	}).catch(() => {
		message.channel.send(message.__('error'));
	});
};

exports.config = {
	enabled: true,
	permLevel: 1,
	perms: [ 'EMBED_LINKS' ],
	category: 'fun'
};

exports.cache = subredditCache;
exports.getSubredditMeme = getSubredditMeme;
