const { BedrockPortal } = require('bedrock-portal');
const { Authflow, Titles } = require('prismarine-auth');

const main = async () => {
  const auth = new Authflow('example', './', { authTitle: Titles.MinecraftNintendoSwitch, deviceType: 'Nintendo', flow: 'live' });

  const session = new BedrockPortal(auth, {
    ip: 'geyserconnect.net',
    port: 19132,
    joinability: 'friends_of_friends', // invite_only, friends_only, friends_of_friends
    disableAltCheck: false, // Disables the alt check
    modules: { // Modules to use
      autoFriendAdd: true, // Automatically adds players that add the authenticated user as a friend
    },
    world: { // only affects the join world card in the friends list
      hostName: 'BedrockPortal', // Displays as the host name of the world
      name: 'BedrockPortal', // Displays as the name of the world
      version: '1.0.0', // Displays as the version of the world
      memberCount: 0, // The current member count of the world
      maxMemberCount: 10, // The max member count of the world
    },
  });

  await session.start();

  await session.invitePlayer('p3'); // gamertag to invite

  session.on('rtaEvent', (event) => { // Emits when an RTA event is received
    console.log(event);
  });

  session.on('playersAdded', (players) => { // Emits when a player joins the session
    console.log(players);
  });

  session.on('playersRemoved', (players) => { // Emits when a player leaves the session
    console.log(players);
  });

};

main();