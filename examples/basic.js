process.env.DEBUG = 'bedrock-portal*'

const { BedrockPortal, Joinability } = require('bedrock-portal')

const main = async () => {
  const portal = new BedrockPortal({
    ip: 'bedrock.opblocks.com',
    port: 19132,
    joinability: Joinability.FriendsOfFriends,
    world: {
      hostName: 'BedrockPortal',
      name: 'BedrockPortal',
      version: '1.21.20',
      memberCount: 0,
      maxMemberCount: 10,
    },
  })

  await portal.start()

  console.log(`Portal started on ${portal.options.webRTCNetworkId} as ${portal.host.profile.gamertag}`)

}

main()