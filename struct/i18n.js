const fs = require('fs');
const path = require('path');
const { Collection, Message, Guild, User } = require('discord.js');

const { errorLog } = require('../functions/eventLoader');
const localeDirectory = path.join(__dirname, '..', 'locales');
const variableRegex = /\$[A-Za-z]+/g;
const localVariableRegex = /@@[A-Za-z_.]+/g;

class i18n {
	constructor(client) {
		this._guildLocaleCache = new Collection();
		this._userLocaleCache = new Collection();
		this._locales = new Collection(); // original locale files, mapped by locale code
		this._localeNames = new Collection(); // short locale => full locale name (e.g. `en-US` => `English (United States)`)
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
			
			if (obj) {
				let keys = Object.keys(obj);
				Object.values(obj).forEach((val, i) => {
					if (!val.meta) return;

					if (!filename.includes('en-US')) aliases.set(val.meta.command, keys[i]);
					else if (client.commands.get(keys[i]) && !client.commands.get(keys[i]).meta) client.commands.get(keys[i]).meta = val.meta;

					if (val.meta.aliases) val.meta.aliases.forEach(alias => {
						aliases.set(alias, keys[i]);
					});
				});
			}
			
			this._aliases.set(args[0], aliases);

			this._localeNames.set(args.shift(), args.join(' '));
		});
		
		let englishLocaleStrings = i18n._countLocaleStrings(this._locales.get('en-US')) - i18n._countLocaleStrings(this._locales.get('en-US').meta);
		
		this._locales.forEach((locale, code) => {
			locale.meta.percentComplete = i18n._calculatedLocaleProgress(code, locale, englishLocaleStrings);
			locale.meta.lang = this._localeNames.get(code);
		});
	}
	
	async init() {
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

	_handleLocaleResult(result) {
		if (!result || !result.locale) return 'English (United States) | en-US';
		else return this._localeNames.get(result.locale) + ' | ' + result.locale;
	}
	
	// count how many locale strings are in the given object. arrays are considered ONE locale string.
	static _countLocaleStrings(object) {
		let values = Object.values(object);
		let count = 0;
		
		for (let val in values) {
			val = values[val];
			if (i18n._isObject(val)) count += this._countLocaleStrings(val);
			else if (typeof val === 'string' || val instanceof Array) count++;
		}
		
		return count;
	}
	
	// courtesy of https://stackoverflow.com/questions/8511281/check-if-a-value-is-an-object-in-javascript#comment25634071_14706877
	static _isObject(obj) {
		return obj === Object(obj) && Object.prototype.toString.call(obj) !== '[object Array]';
	}
	
	// calculate how complete a locale is (in comparison to English - English will return 100)
	static _calculatedLocaleProgress(code, locale, englishLocaleStringCount) {
		if (code === 'en-US') return 100;
		
		let localeStringCount = i18n._countLocaleStrings(locale) - i18n._countLocaleStrings(locale.meta);
		
		return (localeStringCount / englishLocaleStringCount * 100).toFixed(1);
	}
	
	// get locale (file/object) from locale code
	getLocale(code) {
		return this._locales.get(code);
	}
	
	getLocales() {
		return this._localeNames.keyArray();
	}
	
	getLocaleNames() {
		return Array.from(this._localeNames.values());
	}
	
	// returns collection of all locales, with locale codes as keys and locale meta as values
	getAllLocaleMeta() {
		let output = new Collection();
		
		this._localeNames.keyArray().forEach(code => {
			let { meta } = this._locales.get(code);
			output.set(code, meta);
		});
		
		return output;
	}
	
	async getGuildLocaleString(id) {
		let result = await sql.get('SELECT locale FROM guildOptions WHERE guildID = ?', [ id ]);
		return this._handleLocaleResult(result);
	}
	
	async setGuildLocale(id, locale) {
		await sql.run(`INSERT OR IGNORE INTO guildOptions (guildID) VALUES ('${id}')`);
		await sql.run(`UPDATE guildOptions SET locale = ? WHERE guildID = '${id}';`, [ locale ]);
		this._guildLocaleCache.set(id, locale);
	}
	
	async getUserLocaleString(id) {
		let result = await sql.get('SELECT locale FROM userOptions WHERE userID = ?', [ id ]);
		return this._handleLocaleResult(result);
	}
	
	async setUserLocale(id, locale) {
		await sql.run(`INSERT OR IGNORE INTO userOptions (userID) VALUES ('${id}')`);
		await sql.run(`UPDATE userOptions SET locale = ? WHERE userID = '${id}'`, [ locale ]);
		this._userLocaleCache.set(id, locale);
	}
	
	async removeUserLocale(id) {
		await sql.run(`UPDATE userOptions SET locale = null WHERE userID = '${id}'`);
		this._userLocaleCache.delete(id);
	}
	
	// inserts supplied variables into a string - variables are in the format $variable
	// for example, if variables is { pie: 'perhaps' } and the string says 'i like $pie', the output will be 'i like perhaps'
	static _insertVariables(variables, string) {
		if (!variableRegex.test(string)) return string;
		
		let matches = string.match(variableRegex);

		matches.forEach(match => {
			const variable = variables[match.slice(1)];
			string = string.replace(match, variable);
		});

		return string;
	}
	
	// insert inner variables (that is, variables starting with @@ that reference variables inside the locale file, not externally supplied variables)
	// will assume it is in format commands.<variable>.meta.command, otherwise it will attempt <variable> format
	// e.g. passing in @@language will return the string at commands.language.meta.command, yet passing @@struct.xp.level_up will get just that
	_insertInnerVariables(string, locale, code) {
		if (!localVariableRegex.test(string)) return string;
		
		let matches = string.match(localVariableRegex);
		
		matches.forEach(match => {
			let variable = match.slice(2);

			if (locale && locale.commands && locale.commands[variable] && locale.commands[variable].meta) return string = string.replace(match, locale.commands[variable].meta.command);
			let result = this.getString(variable, code);
			
			if (result) string = string.replace(match, result);
			else string = string.replace(match, variable);
		});
		
		return string
	}

	/**
	 * @param {string} string 
	 * @param {string} locale
	 * @param {object} [variables] An object containing all variables used in the string.
	 * @param {string} [_originalLocale] The original locale used, if having to move to en-US
	 * @returns {*}
	 * 
	 * @@ is used for commands or other inner-variables (e.g. @@help will get the translation of the help command)
	 * $ is used for variables, passed in via the variables object
	 */
	getString(string, locale, variables = {}, _originalLocale = 'en-US') {
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
		
		selection = i18n._insertVariables(variables, selection);
		selection = this._insertInnerVariables(selection, file, locale);
		
		return selection;
	}

	/**
	 * Get a locale string for a guild, user, or message
	 * @param {Message|Guild|User|string} resolvable
	 * @returns {string} locale The returned locale
	 */
	getLocaleCode(resolvable) {
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
	get(string, resolvable, variables) {
		return this.getString(string, this.getLocaleCode(resolvable), variables);
	}

	/**
	 * Get a command file name for a given language from a command or alias
	 * @param {string} string Command or alias
	 * @param {Message|Guild|User|string} resolvable Resolvable locale object
	 */
	getCommandFileName(string, resolvable) {
		return this._aliases.get(this.getLocaleCode(resolvable)).get(string) || this._aliases.get('en-US').get(string);
	}

	/**
	 * Get a command's meta in the given language (if possible), determined by a resolvable
	 * @param {string} command The command to get meta for
	 * @param {Message|Guild|User|string} resolvable Resolvable locale object
	 */
	getMeta(command, resolvable) {
		let localeCode = this.getLocaleCode(resolvable);
		let file = this._locales.get(localeCode);
		if (!file.commands[command] || !file.commands[command].meta) return undefined;
		let meta = file.commands[command].meta;
		
		Object.keys(meta).forEach(key => {
			meta[key] = this._insertInnerVariables(meta[key], file, localeCode);
		});
		
		return meta;
	}
	
	// Convert a permissions array to a nicer looking permissions string in the local language
	// e.g. [ 'MANAGE_SERVER', 'EMBED_LINKS' ] => 'Manage Server, Embed Links'
	getPermsString(permsArray, resolvable) {
		let localeCode = this.getLocaleCode(resolvable);
		let copy = [ ...permsArray ];
		
		copy.forEach((perm, i) => {
			copy[i] = this.getString(`permissions.${perm}`, localeCode);
		});
		
		return copy.join(', ');
	}
}

module.exports = i18n;
