module.exports = (stack, type) => {
	if (type == 'debug') if (!stack.includes('eartbeat')) console.log(stack);
	if (type == 'warn') console.warn(stack);
	if (type == 'error') console.error(stack);
	if (type == 'ready') {
		console.log(`Arthur has started! Currently in ${stack.guilds.size != 1 ? '1 guild' : stack.guilds.size + ' guilds'}, attempting to serve ${stack.users.size} users.`);
		stack.owner = stack.users.get(stack.config.owners[0]);
	}
};