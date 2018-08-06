const fs = require('fs');
const sql = require('sqlite');
const path = require('path');
const { Collection, Message, Guild, User } = require('discord.js');

const { errorLog } = require('../functions/eventLoader');
const localeDirectory = path.join(__dirname, '..', 'locales');
const variableRegex = /\$[A-Za-z]+/g;

class i18n {
	constructor () {
		this._guildLocaleCache = new Collection();
		this._userLocaleCache = new Collection();
		this._locales = new Collection();
		this._localeNames = new Collection();
		
		let files = fs.readdirSync(localeDirectory);
		if (!files) throw new Error('No locales found.');
		
		files.filter(file => file.endsWith('.json'));
		if (!files || files.length === 0) throw new Error('No locales found.'); 
		
		files.forEach(file => {
			let filename = file.slice(0, -5);
			let args = filename.split(' ');
			
			this._locales.set(args[0], require(path.join(localeDirectory, file)));
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
		if (!result) return 'English (United States) | en-US';
		else return this._localeNames.get(result.locale) + ' | ' + result.locale;
	}
	
	async getGuildLocaleString (id) {
		let result = await sql.get('SELECT locale FROM guildOptions WHERE guildID = ?', [ id ]);
		return this._handleLocaleResult(result);
	}
	
	async setGuildLocale (id, locale) {
		await sql.run(`INSERT OR IGNORE INTO guildOptions (guildID, locale) VALUES ('${id}', '${locale}'); UPDATE guildOptions SET locale = '${locale}' WHERE guildID = '${id}';`);
		this._guildLocaleCache.set(id, locale);
	}
	
	async getUserLocaleString (id) {
		let result = await sql.get('SELECT locale FROM userOptions WHERE userID = ?', [ id ]);
		return this._handleLocaleResult(result);
	}
	
	async setUserLocale (id, locale) {
		await sql.run(`INSERT OR IGNORE INTO userOptions (userID, locale) VALUES ('${id}', '${locale}'); UPDATE userOptions SET locale = '${locale}' WHERE userID = '${id}'`);
		this._userLocaleCache.set(id, locale);
	}
	
	async removeUserLocale (id) {
		await sql.run(`UPDATE userOptions SET locale = null WHERE userID = '${id}'`);
		this._userLocaleCache.delete(id);
	}

	/**
	 * @param {string} string 
	 * @param {string} locale
	 * @param {object} variables An object containing all variables used in the string.
	 * @returns {*}
	 */
	getString (string, locale, variables = {}) {
		const file = this._locales.get(locale);
		if (!file) {
			locale = 'en_US';
			let error = new Error('Invalid locale.');
			errorLog('i18n error', error.stack, 42069);
			console.error(error);
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
				selection = 'Response not found. This will be fixed ASAP, try again later. String name, for reference: `' + string + '`.';
				let error = new Error('en-US locale missing string `' + string + '`');
				errorLog('i18n error', error.stack, 420);
				console.error('en-US locale missing string ' + string);
			} else return this.getString(string, 'en-US');
		}
		
		variables.$ = '$';
		
		if (typeof selection !== 'string' && !selection instanceof Array) {
			selection = 'String not found. This will be fixed ASAP, try again later.';
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
	 * @param {Message|Guild|User} resolvable
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
		}

		return 'en-US';
	}

	/**
	 * Get a locale string
	 * @param {string} string The string you would like to get
	 * @param {Message|Guild|User} resolvable The resolvable object to get the locale from
	 * @param {object} [variables] Any variables to pass in
	 * @returns {string} locale The returned locale
	 */
	get (string, resolvable, variables) {
		return this.getString(string, this.getLocale(resolvable), variables);
	}
	
}

module.exports = i18n;