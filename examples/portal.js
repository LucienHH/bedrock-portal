/* eslint-disable no-multi-spaces */
// process.env.DEBUG = 'bedrock-portal*';

const { BedrockPortal, Modules, Joinability } = require('bedrock-portal');
const { Authflow, Titles } = require('prismarine-auth');

const main = async () => {
  const auth = new Authflow('example', './', { authTitle: Titles.MinecraftNintendoSwitch, deviceType: 'Nintendo', flow: 'live' });

  const portal = new BedrockPortal(auth, {
    ip: 'geyserconnect.net',
    port: 19132,                               // The port of the server (optional - defaults to 19132)
    joinability: Joinability.FriendsOfFriends, // The joinability of the session (optional - defaults to Joinability.FriendsOfFriends)
    disableAltCheck: false,                    // Disables the alt check (optional - defaults to false)
    world: {                                   // Only affects the join world card in the friends list (optional)
      hostName: 'BedrockPortal',               // Displays as the host name of the world
      name: 'BedrockPortal',                   // Displays as the name of the world
      version: '1',                            // Displays as the version of the world
      memberCount: 0,                          // The current member count of the world
      maxMemberCount: 10,                      // The max member count of the world
    },
  });

  portal.use(Modules.autoFriendAdd, {          // Automatically adds friends to the session
    inviteOnAdd: true,
    conditionToMeet: (player) => player.presenceState === 'Online', // Only add friends that are online and remove friends that are offline
  });

  // Put your event listeners before portal.start() to ensure you don't miss any events

  portal.on('rtaEvent', (event) => {           // Emits when an RTA event is received
    console.log('RTA Event: ', event);
  });

  portal.on('sessionCreated', (session) => {   // Emits when the session is created'
    console.log('Session Created: ', session);
  });

  portal.on('sessionUpdated', (session) => {   // Emits when the session is updated
    console.log('Session Updated: ', session);
  });

  portal.on('playerJoin', (player) => {        // Emits when a player joins the session
    console.log('Player Join: ', player);
  });

  portal.on('playerLeave', (player) => {       // Emits when a player leaves the session
    console.log('Player Leave: ', player);
  });

  portal.on('friendAdded', (player) => {       // Emits when a friend is added. Only emitted if autoFriendAdd module is used
    console.log('Friend Added: ', player);
  });

  portal.on('friendRemoved', (player) => {     // Emits when a friend is removed. Only emitted if autoFriendAdd module is used
    console.log('Friend Removed: ', player);
  });

  await portal.start();                        // Starts the session

  await portal.invitePlayer('p3');             // gamertag or xuid to invite

};

main();
