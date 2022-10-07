const { BedrockPortal } = require('bedrock-portal');
const { Authflow, Titles } = require('prismarine-auth');

const main = async () => {
	const auth = new Authflow('example', './', { authTitle: Titles.MinecraftNintendoSwitch, deviceType: 'Nintendo' });

	const session = new BedrockPortal(auth, {
		ip: 'geyserconnect.net',
		port: 19132,
		joinability: 'friends_of_friends',
	});

	await session.start();

	await session.invitePlayer('p3');

	session.on('rtaEvent', (event) => {
		console.log(event);
	});

	session.on('playersAdded', (players) => {
		console.log(players);
	});

	session.on('playersRemoved', (players) => {
		console.log(players);
	});

};

main();