// from https://gist.github.com/1Conan/9446700b106759e7ba5dcad49dda4fc3

const querystring = require('querystring');
const fetch = require('node-fetch');

function extractWindowYtInitialData(html) {
	const json = /window\["ytInitialData"] = (.*);/gm.exec(html);
	return json ? json[1] : null;
}

function extractYtInitialData(html) {
	const json = /var ytInitialData = (.*);/gm.exec(html);
	return json ? json[1] : null;
}

function extractSearchResults(result) {
	let json = null;
	if (result.includes('window["ytInitialData"]'))
		json = extractWindowYtInitialData(result);
	else if (result.includes('var ytInitialData ='))
		json = extractYtInitialData(result);
	else
		return [];
	if (!json)
		return [];
	const obj = JSON.parse(json);
	// eslint-disable-next-line max-len
	const videoInfo = obj.contents.twoColumnSearchResultsRenderer.primaryContents.sectionListRenderer.contents[0]
		.itemSectionRenderer.contents;
	return videoInfo
		.filter((x) => x.videoRenderer)
		.map(({videoRenderer}) => ({
			id: videoRenderer.videoId,
			title: videoRenderer.title.runs[0].text,
			author: videoRenderer.ownerText.runs[0].text,
			authorId: videoRenderer.ownerText.runs[0].navigationEndpoint.browseEndpoint.browseId,
		}));
}

async function search(query) {
	const res = await fetch(`https://www.youtube.com/results?${querystring.stringify({ search_query: query, sp: 'EgIQAQ%253D%253D' })}`, {
		headers: {
			'user-agent': ' Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
			accept: 'text/html',
			'accept-encoding': 'gzip',
			'accept-language': 'en-US',
		},
	});

	const text = await res.text();
	return extractSearchResults(text);
}

module.exports = search;