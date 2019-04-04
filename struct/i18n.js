const fs = require('fs');
const sql = require('sqlite');
const path = require('path');
const { Collection, Message, Guild, User } = require('discord.js');

const { errorLog } = require('../functions/eventLoader');
const localeDirectory = path.join(__dirname, '..', 'locales');
const variableRegex = /\$[A-Za-z]+/g;

class i18n {
	constructor (client) {
		this._guildLocaleCache = new Collection();
		this._userLocaleCache = new Collection();
		this._locales = new Collection();
		this._localeNames = new Collection();
		this._aliases = new Collection(); // collection of collections: language code => [ alias => english command name ]
		
		let files = fs.readdirSync(localeDirectory);
		if (!files) throw new Error('No locales found.');
		
		files.filter(file => file.endsWith('.json'));
		if (!files || files.length === 0) throw new Error('No locales found.'); 
		
		files.forEach(file => {
			let filename = file.slice(0, -5);
			let args = filename.split(' ');
			
			this._locales.set(args[0], require(path.join(localeDirectory, file)));

			let aliases = new Collection();
			let obj = this._locales.get(args[0]).commands;
			let keys = Object.keys(obj);
			Object.values(obj).forEach((val, i) => {
				if (!val.meta) return;

				if (!filename.includes('en-US')) aliases.set(val.meta.command, keys[i]);
				else if (client.commands.get(keys[i]) && !client.commands.get(keys[i]).meta) client.commands.get(keys[i]).meta = val.meta;

				if (val.meta.aliases) val.meta.aliases.forEach(alias => {
					aliases.set(alias, keys[i]);
				});
			});
			this._aliases.set(args[0], aliases);

			this._localeNames.set(args.shift(), args.join(' '));
		});
	}
	
	async init () {
		console.log('Caching guild and user locale settings..');
		
		const guildResults = await sql.all('SELECT guildID, locale FROM guildOptions');
		if (guildResults) {
			guildResults.forEach(result => {
				if (!result.locale) return;
				this._guildLocaleCache.set(result.guildID, result.locale);
			});
			console.log('Guild locale settings cached.');
		}

		const userResults = await sql.all('SELECT userID, locale FROM userOptions');
		if (!userResults) return;
		userResults.forEach(result => {
			if (!result.locale) return;
			this._userLocaleCache.set(result.userID, result.locale);
		});
		console.log('User locale settings cached.\n');
	}
	
	getLocales () {
		return this._localeNames.keyArray();
	}
	
	getLocaleNames () {
		return Array.from(this._localeNames.values());
	}
	
	_handleLocaleResult (result) {
		if (!result || !result.locale) return 'English (United States) | en-US';
		else return this._localeNames.get(result.locale) + ' | ' + result.locale;
	}
	
	async getGuildLocaleString (id) {
		let result = await sql.get('SELECT locale FROM guildOptions WHERE guildID = ?', [ id ]);
		return this._handleLocaleResult(result);
	}
	
	async setGuildLocale (id, locale) {
		await sql.run(`INSERT OR IGNORE INTO guildOptions (guildID) VALUES ('${id}')`);
		await sql.run(`UPDATE guildOptions SET locale = '${locale}' WHERE guildID = '${id}';`);
		this._guildLocaleCache.set(id, locale);
	}
	
	async getUserLocaleString (id) {
		let result = await sql.get('SELECT locale FROM userOptions WHERE userID = ?', [ id ]);
		return this._handleLocaleResult(result);
	}
	
	async setUserLocale (id, locale) {
		await sql.run(`INSERT OR IGNORE INTO userOptions (userID) VALUES ('${id}')`);
		await sql.run(`UPDATE userOptions SET locale = '${locale}' WHERE userID = '${id}'`);
		this._userLocaleCache.set(id, locale);
	}
	
	async removeUserLocale (id) {
		await sql.run(`UPDATE userOptions SET locale = null WHERE userID = '${id}'`);
		this._userLocaleCache.delete(id);
	}

	/**
	 * @param {string} string 
	 * @param {string} locale
	 * @param {object} [variables] An object containing all variables used in the string.
	 * @param {string} [_originalLocale] The original locale used, if having to move to en-US
	 * @returns {*}
	 */
	getString (string, locale, variables = {}, _originalLocale = 'en-US') {
		let file = this._locales.get(locale);
		if (!file) {
			let error = new Error('Invalid locale: ' + locale);
			errorLog('i18n error', error.stack, 42069);
			console.error(error);
			locale = 'en-US';
			file = this._locales.get(locale);
		}
		
		let retry = false;
		let args = string.split('.');
		let currentLayer = file;
		let selection = args.pop();
		
		args.forEach(arg => {
			if (retry) return;
			currentLayer = currentLayer[arg];
			if (!currentLayer) return retry = true;
		});
		
		if (currentLayer) selection = currentLayer[selection];
		if (!selection) retry = true;

		if (retry) {
			if (locale === 'en-US') {
				selection = this.getString('struct.i18n.response_not_found', _originalLocale, { string });
				let error = new Error('en-US locale missing string `' + string + '`');
				errorLog('i18n error', error.stack, 420);
				console.error('en-US locale missing string ' + string);
			} else return this.getString(string, 'en-US', variables, locale);
		}
		
		if (typeof selection !== 'string' && !selection instanceof Array) {
			selection = this.getString('struct.i18n.response_not_found', locale, { string });
			let error = new Error(`Locale string ${string} returning ${selection}`);
			errorLog('i18n error', error.stack, 69);
			console.error(`Locale string ${string} returning ${selection}`);
		}
		if (selection instanceof Array) selection = selection[Math.floor(Math.random() * selection.length)];
		
		if (!variableRegex.test(selection)) return selection;
		let matches = selection.match(variableRegex);
		
		matches.forEach(match => {
			const variable = variables[match.slice(1)];
			selection = selection.replace(match, variable);
		});
		
		return selection;
	}

	/**
	 * Get a locale string for a guild, user, or message
	 * @param {Message|Guild|User|string} resolvable
	 * @returns {string} locale The returned locale
	 */
	getLocale (resolvable) {
		if (resolvable instanceof Message) {
			if (this._userLocaleCache.has(resolvable.author.id)) return this._userLocaleCache.get(resolvable.author.id);
			if (resolvable.guild && this._guildLocaleCache.has(resolvable.guild.id)) return this._guildLocaleCache.get(resolvable.guild.id);
		} else if (resolvable instanceof Guild) {
			if (this._guildLocaleCache.has(resolvable.id)) return this._guildLocaleCache.get(resolvable.id);
		} else if (resolvable instanceof User) {
			if (this._userLocaleCache.has(resolvable.id)) return this._userLocaleCache.get(resolvable.id);
		} else if (typeof resolvable === 'string') {
			if (this._locales.has(resolvable)) return resolvable;
		}

		return 'en-US';
	}

	/**
	 * Get a locale string
	 * @param {string} string The string you would like to get
	 * @param {Message|Guild|User|string} resolvable The resolvable object to get the locale from
	 * @param {object} [variables] Any variables to pass in
	 * @returns {string} locale The returned locale
	 */
	get (string, resolvable, variables) {
		return this.getString(string, this.getLocale(resolvable), variables);
	}

	/**
	 * Get a command file name for a given language from a command or alias
	 * @param {string} string Command or alias
	 * @param {Message|Guild|User|string} resolvable Resolvable locale object
	 */
	getCommandFileName(string, resolvable) {
		return this._aliases.get(this.getLocale(resolvable)).get(string) || this._aliases.get('en-US').get(string);
	}

	/**
	 * Get a command's meta in the given language (if possible), determined by a resolvable
	 * @param {string} command The command to get meta for
	 * @param {Message|Guild|User|string} resolvable Resolvable locale object
	 */
	getMeta(command, resolvable) {
		let file = this._locales.get(this.getLocale(resolvable));
		if (!file.commands[command] || !file.commands[command].meta) return undefined;
		return file.commands[command].meta;
	}
}

module.exports = i18n;
