const { BedrockPortal, Modules } = require('bedrock-portal')
const { Authflow, Titles } = require('prismarine-auth')

const main = async () => {
  const auth = new Authflow('example', './', { authTitle: Titles.MinecraftNintendoSwitch, deviceType: 'Nintendo', flow: 'live' })

  const portal = new BedrockPortal(auth, {
    ip: 'geyserconnect.net',
    port: 19132,
  })

  // Automatically invite players to the server when they join a Realms
  portal.use(Modules.RedirectFromRealm, {

    // Options for the bedrock-protocol client, see https://github.com/PrismarineJS/bedrock-protocol for options
    clientOptions: {
      realms: {

        // The realm ID of the realm to invite players from
        realmId: '',

        // The invite code of the realm to invite players from
        realmInvite: '',

        // A function to pick a realm from the list of realms
        pickRealm: (realms) => realms[0],
      },

      // A function to handle the MSA code
      onMsaCode: console.log,
    },

    // Options for the invite command, sends an invite when the message is sent in chat
    chatCommand: {

      // Whether sending the command in chat should trigger an invite (optional - defaults to true)
      enabled: true,

      // The cooldown of the command in milliseconds (optional - defaults to 60000)
      cooldown: 60000,

      // The message to send in chat to run the command (optional - defaults to 'invite')
      message: 'invite',
    },

  })

  await portal.start()

}

main()
