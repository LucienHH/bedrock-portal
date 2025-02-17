process.env.DEBUG = 'bedrock-portal*'

const { BedrockPortal, Joinability, Modules } = require('bedrock-portal')

const main = async () => {

  const portal = new BedrockPortal({
    joinability: Joinability.FriendsOfFriends,
    world: {
      hostName: 'BedrockPortal',
      name: 'BedrockPortal',
      version: '1.21.20',
      memberCount: 0,
      maxMemberCount: 10,
    },
  })

  portal.use(Modules.ServerFromList, {
    form: {
      title: '§l§aServer Form List',
      content: '§7Please select a server to join',
      buttons: [
        { text: '§8Anarchy Server\n§7Click Here§!', ip: 'bedrock.opblocks.com', port: 19132 },
        { text: '§7Creative Server\n§7Click Here§', ip: 'bedrock.opblocks.com', port: 19132 },
        { text: '§6Survival Server\n§7Click Here§!', ip: 'bedrock.opblocks.com', port: 19132 },
      ],
    },
    timeout: 60000,
    timeoutMessage: '§cYou took too long to select a server!',
  })

  await portal.start()

  console.log(`Portal started on ${portal.options.webRTCNetworkId} as ${portal.host.profile.gamertag}`)

}

main()