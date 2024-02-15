/* eslint-disable no-multi-spaces */

const { BedrockPortal, Modules, Joinability } = require('bedrock-portal')
const { Authflow, Titles } = require('prismarine-auth')

const main = async () => {
  const auth = new Authflow('example', './', { authTitle: Titles.MinecraftNintendoSwitch, deviceType: 'Nintendo', flow: 'live' })

  const portal = new BedrockPortal(auth, {
    ip: 'geyserconnect.net',
    port: 19132,                               // The port of the server (optional - defaults to 19132)
    joinability: Joinability.FriendsOfFriends, // The joinability of the session (optional - defaults to Joinability.FriendsOfFriends)
    disableAltCheck: false,                    // Disables the alt check (optional - defaults to false)
  })

  portal.use(Modules.redirectFromRealm, {      // Automatically invite players to the server when they join a Realm
    clientOptions: {                           // Options for the bedrock-protocol client, see https://github.com/PrismarineJS/bedrock-protocol for options
      realms: {
        realmId: '',                           // The realm ID of the realm to invite players from
        realmInvite: '',                       // The invite code of the realm to invite players from
        pickRealm: (realms) => realms[0],      // A function to pick a realm from the list of realms
      },
      onMsaCode: console.log,                  // A function to handle the MSA code
    },
    chatCommand: {                             // Options for the chat command
      enabled: true,                           // Whether sending the command in chat should trigger an invite (optional - defaults to true)
      cooldown: 60000,                         // The cooldown of the command in milliseconds (optional - defaults to 60000)
      message: 'invite',                       // The message to send in chat to run the command (optional - defaults to 'invite')
    },
  })

  // Put your event listeners before portal.start() to ensure you don't miss any events

  portal.on('rtaEvent', (event) => {           // Emits when an RTA event is received
    console.log('RTA Event: ', event)
  })

  portal.on('sessionCreated', (session) => {   // Emits when the session is created'
    console.log('Session Created: ', session)
  })

  portal.on('sessionUpdated', (session) => {   // Emits when the session is updated
    console.log('Session Updated: ', session)
  })

  portal.on('playerJoin', (player) => {        // Emits when a player joins the session
    console.log('Player Join: ', player)
  })

  portal.on('playerLeave', (player) => {       // Emits when a player leaves the session
    console.log('Player Leave: ', player)
  })

  await portal.start()                        // Starts the session

}

main()
