const grainyRice = [
	'https://image.shutterstock.com/image-photo/rice-black-cup-on-background-600w-1692247006.jpg',
	'https://image.shutterstock.com/image-photo/white-rice-bowl-600w-550853263.jpg',
	'https://image.shutterstock.com/image-photo/white-rice-thai-jasmine-wooden-600w-535218229.jpg',
	'https://image.shutterstock.com/image-photo/rice-wooden-bowl-isolated-on-600w-1105317755.jpg',
	'https://image.shutterstock.com/image-photo/long-basmati-rice-600w-1095028934.jpg',
	'https://image.shutterstock.com/image-photo/uncooked-rice-bowl-600w-1693528666.jpg',
	'https://image.shutterstock.com/image-photo/streamed-sticky-rice-ceramic-cup-600w-1608821710.jpg',
	'https://image.shutterstock.com/image-photo/bowl-tasty-cooked-rice-parsley-600w-1657394374.jpg',
	'https://image.shutterstock.com/image-photo/thailand-rice-wooden-bowl-600w-567229531.jpg',
	'https://image.shutterstock.com/image-photo/cooked-white-rice-thai-jasmine-600w-688370464.jpg',
	'https://image.shutterstock.com/image-vector/two-handfuls-white-parboiled-red-600w-758406544.jpg',
	'https://image.shutterstock.com/image-photo/white-rice-bowl-600w-560830615.jpg',
	'https://image.shutterstock.com/image-photo/fried-rice-chicken-prepared-served-600w-677985067.jpg',
	'https://image.shutterstock.com/image-photo/jasmine-rice-brown-red-riceblack-600w-661479826.jpg',
	'https://image.shutterstock.com/image-photo/fried-rice-plate-on-table-600w-783015019.jpg',
	'https://image.shutterstock.com/image-photo/veg-schezwan-fried-rice-black-600w-1517080016.jpg',
	'https://image.shutterstock.com/image-photo/rice-bowl-on-white-background-600w-710865547.jpg',
	'https://image.shutterstock.com/image-photo/rice-field-600w-175193915.jpg',
	'https://image.shutterstock.com/image-photo/vietnam-farmer-bearing-seedlings-rice-600w-1127931986.jpg',
	'https://image.shutterstock.com/image-photo/appetizing-healthy-rice-vegetables-white-600w-279069605.jpg',
	'https://image.shutterstock.com/image-photo/bowl-rice-vegetables-isolated-on-600w-751234129.jpg',
	'https://image.shutterstock.com/image-photo/raw-red-rice-wooden-bowl-600w-1470669227.jpg'
];

const humanyRice = [
	'https://i.imgur.com/btnY10d.jpg',
	'https://i.imgur.com/ZBe06eO.jpg',
	'https://i.imgur.com/F9oohhC.jpg',
	'https://i.imgur.com/fc4mtGQ.jpg',
	'https://i.imgur.com/T3MnMRx.jpg',
	'https://i.imgur.com/Gd7Spia.jpg',
	'https://i.imgur.com/4B386M0.jpg',
	'https://i.imgur.com/fGMpnVa.jpg',
	'https://i.imgur.com/SPFfNKP.jpg',
	'https://i.imgur.com/9zYmTjf.jpg',
	'https://i.imgur.com/wz5PmqB.jpg',
	'https://i.imgur.com/bj5ONe3.jpg',
	'https://i.imgur.com/uPlqYS0.jpg',
	'https://i.imgur.com/hOWx7dt.jpg',
	'https://i.imgur.com/UxZpVja.jpg',
	'https://i.imgur.com/bz48P6e.jpg',
	'https://i.imgur.com/AHtwjID.jpg',
	'https://i.imgur.com/jzjgwF8.jpg',
	'https://i.imgur.com/715qewy.jpg',
	'https://i.imgur.com/rwsb6je.jpg',
	'https://i.imgur.com/oMxOnrT.png'
];

exports.run = (message) => {
	let file = Math.floor(Math.random() * 5) === 1
		? humanyRice[Math.floor(Math.random() * humanyRice.length)]
		: grainyRice[Math.floor(Math.random() * grainyRice.length)];

	message.channel.send({ files: [ file ] });
};

exports.config = {
	enabled: true,
	permLevel: 1,
	perms: ['ATTACH_FILES'],
	category: 'eggs'
};

exports.meta = {
	command: 'rice',
	name: 'Rice',
	description: 'Here y\'are, Rice.',
	help: 'Here y\'are, Rice.'
};