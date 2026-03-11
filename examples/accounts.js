process.env.DEBUG = 'bedrock-portal*'

const { BedrockPortal, Modules } = require('bedrock-portal')

const main = async () => {

  const portal = new BedrockPortal({
    ip: 'geyserconnect.net',
    port: 19132,
    peers: [
      { username: 'account1' },
      { username: 'account2' },
    ],
  })

  portal.use(Modules.AutoFriendAdd, {
    inviteOnAdd: true,
  })

  await portal.start()

}

main()
