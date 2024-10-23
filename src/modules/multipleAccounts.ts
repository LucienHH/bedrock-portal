import type { Authflow } from 'prismarine-auth'

import type { BedrockPortal } from '../index'

import Module from '../classes/Module'
import Host from '../classes/Host'

export default class MultipleAccounts extends Module {

  public options: {
    /**
     * An array of authflows from prismarine-auth, these accounts are automatically added to the host session and allows players to add them as a friend to join the game
     * @example
     * portal.use(Modules.MultipleAccounts, {
          accounts: [
            new Authflow('account1', './'),
            new Authflow('account2', './')
          ],
        })
    */
    accounts: Authflow[]
  }

  public peers: Map<string, Host>

  constructor(portal: BedrockPortal) {
    super(portal, 'multipleAccounts', 'Make the portal session joinable from multiple accounts')

    this.options = {
      accounts: [],
    }

    this.peers = new Map()

  }

  async run() {

    if (!this.portal.host || !this.portal.host.profile) {
      this.debug('No host to connect to')
      return
    }

    await Promise.all(this.options.accounts.map(account => account.getXboxToken()))

    for (const account of this.options.accounts) {

      const peer = new Host(this.portal, account)

      await peer.connect()

      if (!peer.profile || !peer.connectionId) {
        this.debug(`Failed to connect to ${account.username}`)
        continue
      }

      this.peers.set(peer.profile.xuid, peer)

      this.debug(`Connected ${peer.profile.gamertag}`)

      const hostAddPeer = await this.portal.host.rest.addXboxFriend(peer.profile.xuid)
        .catch(error => ({ error }))

      const peerAddHost = await peer.rest.addXboxFriend(this.portal.host.profile.xuid)
        .catch(error => ({ error }))

      if ((hostAddPeer && 'error' in hostAddPeer) || (peerAddHost && 'error' in peerAddHost)) {
        if (hostAddPeer) this.debug(`Failed to add ${peer.profile.gamertag} as a friend - ${hostAddPeer.error.message}`)
        if (peerAddHost) this.debug(`Failed to add ${this.portal.host.profile.gamertag} as a friend - ${peerAddHost.error.message}`)
        console.error(`Error creating a friendship between ${this.portal.host.profile.gamertag} and ${peer.profile.gamertag} - BedrockPortal will continue to run, but will not be joinable from ${peer.profile.gamertag}`)
        continue
      }

      await peer.rest.addConnection(this.portal.session.name, peer.profile.xuid, peer.connectionId, peer.subscriptionId)

      await peer.rest.setActivity(this.portal.session.name)

    }
  }

  async stop() {
    super.stop()

    for (const peer of this.peers.values()) {

      if (!peer.rta) continue

      await peer.rta.destroy()
        .then(() => this.debug(`Disconnected ${peer.profile?.gamertag}`))
        .catch(() => this.debug(`Failed to disconnect ${peer.profile?.gamertag}`))

    }

  }


}
