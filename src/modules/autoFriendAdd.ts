import type { BedrockPortal } from '../index'

import { setTimeout } from 'timers/promises'

import Module from '../classes/Module'
import Player from '../classes/Player'
import Host from '../classes/Host'

import MultipleAccounts from './multipleAccounts'

export default class AutoFriendAdd extends Module {

  public interval: NodeJS.Timeout | null = null

  constructor() {
    super('autoFriendAdd', 'Automatically adds followers as friends')

    this.options = {
      inviteOnAdd: false,
      conditionToMeet: () => true,
      checkInterval: 30000,
      addInterval: 2000,
      removeInterval: 2000,
    }
  }

  async run(portal: BedrockPortal) {

    const addXboxFriend = async (host: Host) => {
      this.debug('Checking for followers to add')

      const followers = await host.rest.getXboxFollowers()
        .catch(() => [])

      this.debug(`Found ${followers.length} follower(s)`)

      const needsAdding = followers.filter(res => !res.isFollowedByCaller && this.options.conditionToMeet(res))

      this.debug(`Adding ${needsAdding.length} account(s) [${needsAdding.map(res=> res.gamertag).join(', ')}]`)

      for (const account of needsAdding) {
        await host.rest.addXboxFriend(account.xuid).catch(() => {
          throw Error(`Failed to add ${account.gamertag}`)
        })

        if (this.options.inviteOnAdd) {
          await portal.invitePlayer(account.xuid).catch(() => {
            throw Error(`Failed to invite ${account.gamertag}`)
          })
        }

        portal.emit('friendAdded', new Player(account, null))

        this.debug(`Added & invited ${account.gamertag}`)

        await setTimeout(this.options.addInterval)
      }

      this.debug('Checking for friends to remove')

      const friends = await host.rest.getXboxFriends()
        .catch(() => [])

      this.debug(`Found ${friends.length} friend(s)`)

      const needsRemoving = friends.filter(res => !res.isFollowingCaller || !this.options.conditionToMeet(res))

      this.debug(`Removing ${needsRemoving.length} account(s) [${needsRemoving.map(res => res.gamertag).join(', ')}]`)

      for (const account of needsRemoving) {
        await host.rest.removeXboxFriend(account.xuid).catch(() => {
          throw Error(`Failed to remove ${account.gamertag}`)
        })

        portal.emit('friendRemoved', new Player(account, null))

        this.debug(`Removed ${account.gamertag}`)

        await setTimeout(this.options.removeInterval)
      }

    }

    this.interval = setInterval(() => {

      const multipleAccounts = portal.modules.get('multipleAccounts')

      if (multipleAccounts && multipleAccounts instanceof MultipleAccounts) {
        for (const account of multipleAccounts.peers.values()) {
          addXboxFriend(account)
            .catch(error => this.debug(`Error: ${error.message}`, error))
        }
      }

      addXboxFriend(portal.host)
        .catch(error => this.debug(`Error: ${error.message}`, error))

    }, this.options.checkInterval)

  }

  async stop() {
    super.stop()

    if (this.interval) {
      clearInterval(this.interval)
    }
  }
}
