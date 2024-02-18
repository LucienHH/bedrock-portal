process.env.DEBUG = 'bedrock-portal*'

const { BedrockPortal, Modules } = require('bedrock-portal')
const { Authflow, Titles } = require('prismarine-auth')

const handleMsaCode = (account, response) => {
  console.log(`${account} - ${response.message}`)
}

const main = async () => {
  const auth = new Authflow('example', './', { authTitle: Titles.MinecraftNintendoSwitch, deviceType: 'Nintendo', flow: 'live' })

  const portal = new BedrockPortal(auth, {
    ip: 'geyserconnect.net',
    port: 19132,
  })

  portal.use(Modules.AutoFriendAdd, {
    inviteOnAdd: true,
  })

  portal.use(Modules.MultipleAccounts, {
    accounts: [
      new Authflow('account1', './', { authTitle: Titles.MinecraftNintendoSwitch, deviceType: 'Nintendo', flow: 'live' }, (res) => handleMsaCode('account1', res)),
      new Authflow('account2', './', { authTitle: Titles.MinecraftNintendoSwitch, deviceType: 'Nintendo', flow: 'live' }, (res) => handleMsaCode('account2', res)),
    ],
  })

  await portal.start()

}

main()
