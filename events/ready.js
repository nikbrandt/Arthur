module.exports = client => {
	console.log(`\nArthur has started! Currently in ${client.guilds.size} guilds, attempting to serve ${client.users.size} users. (${client.tempStopwatch.elapsedMilliseconds} ms)`);
	client.tempStopwatch.stop();
	client.tempStopwatch = undefined;
	client.owner = client.users.get(client.config.owners[0])
};