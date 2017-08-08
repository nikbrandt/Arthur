exports.run = (message) => {
	const paaQs = ['*paasta#6587 - 5/18/17 at 4:41 PM from <#219218693928910848>*\n```The ancient Chinese legends in the scroll of The Dark Cloud, where our hero Cling The Clang makes his way to the clouds. Slowly but surely he makes his way to the Temple of the Dark Sky. He finds the legendary collection of a wide selection of "the toys". But which does he choose? The symbol of the dark, a black and long one? Or the symbol of the Heavans, A moderately sized white one. He gazes upon them thinking of which to choose. Then it hits him. He came to the dark for a reason, its go black you can\'t go back.\n```', '*paasta#6587 - 4/19/17 at 7:05 PM from <#219218693928910848>*\n```corn bread watermelon lookin ass nigga\n```'];
    message.channel.send(paaQs[Math.floor(Math.random() * paaQs.length)]);
};

exports.config = {
	enabled: true,
	permLevel: 2,
	aliases: []
};

exports.help = {
	name: 'paasta',
	description: 'An easter egg based off paasta',
	usage: 'paasta',
	help: 'An easter egg based off paasta',
	category: 'Eggs'
};