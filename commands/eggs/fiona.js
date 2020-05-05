const morseEncode = {
	"0": "-----",
	"1": ".----",
	"2": "..---",
	"3": "...--",
	"4": "....-",
	"5": ".....",
	"6": "-....",
	"7": "--...",
	"8": "---..",
	"9": "----.",
	"a": ".-",
	"b": "-...",
	"c": "-.-.",
	"d": "-..",
	"e": ".",
	"f": "..-.",
	"g": "--.",
	"h": "....",
	"i": "..",
	"j": ".---",
	"k": "-.-",
	"l": ".-..",
	"m": "--",
	"n": "-.",
	"o": "---",
	"p": ".--.",
	"q": "--.-",
	"r": ".-.",
	"s": "...",
	"t": "-",
	"u": "..-",
	"v": "...-",
	"w": ".--",
	"x": "-..-",
	"y": "-.--",
	"z": "--..",
	".": ".-.-.-",
	",": "--..--",
	"?": "..--..",
	"!": "-.-.--",
	"-": "-....-",
	"/": "-..-.",
	"@": ".--.-.",
	"(": "-.--.",
	")": "-.--.-",
	" ": "_",
	"": " "
}; // thanks to (https://gist.github.com/mohayonao/094c71af14fe4791c5dd)!

const waluigiEncode = {
	'.': 'wa',
	'-': 'waaa',
	' ': 'woo',
	'_': 'wah'
};

function reverse (object) {
	let keys = Object.keys(object);
	let vals = Object.values(object);

	let out = {};

	for (let i = 0; i < keys.length; i++) {
		out[vals[i]] = keys[i];
	}

	return out;
}

const morseDecode = reverse(morseEncode);
const waluigiDecode = reverse(waluigiEncode);

exports.run = (message, args) => {
	if (!args[0] || !args[1]) return message.channel.send('waaa wa woo waaa waaa waaa woo wa waaa wa waaa wa waaa');

	let suffix = args.slice(1).join(' ').toLowerCase();

	if (args[0] === 'e' || args[0] === 'encode') {
		suffix = Array.from(suffix);
		let out = '';

		for (let i = 0; i < suffix.length; i++) {
			if (morseEncode[suffix[i]]) {
				let morse = Array.from(morseEncode[suffix[i]]);

				for (let j = 0; j < morse.length; j++) {
					out += waluigiEncode[morse[j]] + ' ';
				}

				if (i + 1 < suffix.length && suffix[i + 1] !== ' ' && suffix[i] !== ' ') out += 'woo '
			} else out += '? '
		}

		message.channel.send(out);
	} else if (args[0] === 'd' || args[0] === 'decode') {
		suffix = suffix.split(' wah ');
		let out = '';

		suffix.forEach(arr => {
			arr = arr.split('woo').filter(item => !!item);

			arr.forEach(a => {
				a = a.split(' ').filter(item => !!item);
				let temp = '';

				a.forEach(text => {
					if (waluigiDecode[text]) temp += waluigiDecode[text];
					else temp += '?'
				});

				if (morseDecode[temp]) out += morseDecode[temp];
				else out += '?';
			});

			out += ' ';
		});

		message.channel.send(out);
	} else message.channel.send('waaa wa woo waaa waaa waaa woo wa waaa wa waaa wa waaa');
};

exports.config = {
	enabled: true,
	permLevel: 1,
	aliases: [],
	perms: [ 'EMBED_LINKS' ],
	category: 'eggs'
};

exports.meta = {
	command: 'fiona',
	name: 'Fiona',
	description: 'We speak in waah',
	help: 'waaa woo waaa waaa waaa woo wa waaa waaa wa wah wa wa wa woo wa woo waaa wa waaa wa woo wa waaa wa woo wa woo waaa'
};