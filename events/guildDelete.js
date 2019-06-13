const { post } = require('../functions/dbots');

module.exports = (client) => {
	setTimeout(() => {
		post(client);
	}, 1000);
};