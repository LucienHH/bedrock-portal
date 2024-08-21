process.env.DEBUG = 'bedrock-portal*'

const { BedrockPortal, Joinability } = require('bedrock-portal')
const { Authflow, Titles } = require('prismarine-auth')

const main = async () => {
  const auth = new Authflow('example', './', { authTitle: Titles.XboxAppIOS, deviceType: 'iOS', flow: 'sisu' })

  const portal = new BedrockPortal(auth, {
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

}

main()