process.env.DEBUG = 'bedrock-portal*'

const { BedrockPortal, Modules } = require('bedrock-portal')
const { Authflow, Titles } = require('prismarine-auth')

const handleMsaCode = (account, response) => {
  console.log(`${account} - ${response.message}`)
}

const main = async () => {

  const portal = new BedrockPortal({
    ip: 'geyserconnect.net',
    port: 19132,
  })

  portal.use(Modules.AutoFriendAdd, {
    inviteOnAdd: true,
  })

  portal.use(Modules.MultipleAccounts, {
    accounts: [
      new Authflow('account1', './', { authTitle: Titles.MinecraftIOS, deviceType: 'iOS', flow: 'sisu' }, (res) => handleMsaCode('account1', res)),
      new Authflow('account2', './', { authTitle: Titles.MinecraftIOS, deviceType: 'iOS', flow: 'sisu' }, (res) => handleMsaCode('account2', res)),
    ],
  })

  await portal.start()

}

main()
