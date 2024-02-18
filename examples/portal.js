/* eslint-disable no-multi-spaces */
process.env.DEBUG = 'bedrock-portal*'

const { BedrockPortal, Modules, Joinability } = require('bedrock-portal')
const { Authflow, Titles } = require('prismarine-auth')

const main = async () => {
  const auth = new Authflow('example', './', { authTitle: Titles.MinecraftNintendoSwitch, deviceType: 'Nintendo', flow: 'live' })

  const portal = new BedrockPortal(auth, {
    ip: 'geyserconnect.net',
    port: 19132,

    // The joinability of the session (optional - defaults to Joinability.FriendsOfFriends)
    joinability: Joinability.FriendsOfFriends,

    // Only affects the join world card in the friends list (optional)
    world: {

      // Displays as the host name of the world
      hostName: 'BedrockPortal',

      // Displays as the name of the world
      name: 'BedrockPortal',

      // Displays as the version of the world
      version: '1',

      // The current member count of the world
      memberCount: 0,

      // The max member count of the world
      maxMemberCount: 10,

    },
  })

  // Automatically checks for friends to add and removes friends that don't meet the condition
  portal.use(Modules.AutoFriendAdd, {

    // Whether to invite players when they are added as a friend (optional - defaults to false)
    inviteOnAdd: true,

    // Only add friends that are online and remove friends that are offline
    conditionToMeet: (player) => player.presenceState === 'Online',

    // How often to check for friends to add/remove (optional - defaults to 30000ms)
    checkInterval: 30000,

    // How long to wait between adding friends (optional - defaults to 2000ms)
    addInterval: 2000,

    // How long to wait between removing friends (optional - defaults to 2000ms)
    removeInterval: 2000,

  })

  // Automatically invites players when they send a message with the specified command
  portal.use(Modules.InviteOnMessage, {

    // The command to use to invite players (optional - defaults to 'invite')
    command: 'invite',

    // How often to check for messages (optional - defaults to 30000ms)
    checkInterval: 30000,

  })

  // Put your event listeners before portal.start() to ensure you don't miss any events

  // Emits when an RTA event is received
  portal.on('rtaEvent', (event) => {
    console.log('RTA Event: ', event)
  })

  // Emits when the session is created'
  portal.on('sessionCreated', (session) => {
    console.log('Session Created: ', session)
  })

  // Emits when the session is updated
  portal.on('sessionUpdated', (session) => {
    console.log('Session Updated: ', session)
  })

  // Emits when a player joins the session
  portal.on('playerJoin', (player) => {
    console.log('Player Join: ', player)
  })

  // Emits when a player leaves the session
  portal.on('playerLeave', (player) => {
    console.log('Player Leave: ', player)
  })

  // Emits when a friend is added. Only emitted if autoFriendAdd module is used
  portal.on('friendAdded', (player) => {
    console.log('Friend Added: ', player)
  })

  // Emits when a friend is removed. Only emitted if autoFriendAdd module is used
  portal.on('friendRemoved', (player) => {
    console.log('Friend Removed: ', player)
  })

  // Emits when a message is received. Only emitted if inviteOnMessage module is used
  portal.on('messageRecieved', (message) => {
    console.log('Message Received: ', message)
  })

  await portal.start()

  // Invite a player to the session
  await portal.invitePlayer('p3')

}

main()
