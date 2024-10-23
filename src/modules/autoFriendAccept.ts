import type { BedrockPortal } from '../index'
import type { FriendRequestPerson } from '../types/peoplehub'

import Module from '../classes/Module'
import Player from '../classes/Player'
import Host from '../classes/Host'

import MultipleAccounts from './multipleAccounts'

type EventResponseData = {
  NotificationType: string,
  Xuid: string,
  Count: number,
}

export default class AutoFriendAccept extends Module {

  public options: {
    /**
     * Automatically invites added friends to the game
     * @default false
     */
    inviteOnAdd: boolean,
    /**
     * If the function returns true then the request will be accepted
     * @default () => true
     * @example
     * (player) => player.gamertag === 'Steve'
    */
    conditionToMeet: (request: FriendRequestPerson) => boolean,
  }

  constructor(portal: BedrockPortal) {
    super(portal, 'autoFriendAccept', 'Automatically accept friend requests')

    this.options = {
      inviteOnAdd: false,
      conditionToMeet: () => true,
    }
  }

  async run() {

    const addXboxFriend = async (host: Host) => {

      host.rta?.on('event', async (event) => {

        if ((event.data as EventResponseData).NotificationType !== 'IncomingFriendRequestCountChanged') return

        this.debug('Received Friend RTA event', event)

        const requests = await host.rest.getFriendRequestsReceived()
          .then(res => res.filter(this.options.conditionToMeet))

        this.debug(`Received ${requests.length} friend request(s)`)

        if (!requests.length) return

        const accept = await host.rest.acceptFriendRequests(requests.map(req => req.xuid))

        this.debug(`Accepted ${accept.updatedPeople.length} friend request(s)`)

        for (const person of requests.filter(req => accept.updatedPeople.includes(req.xuid))) {
          this.portal.emit('friendAdded', new Player(person, null))

          this.debug(`Accepted ${person.gamertag}`)

          if (this.options.inviteOnAdd) {
            await this.portal.invitePlayer(person.xuid).catch(error => this.debug(`Error: Failed to invite ${person.gamertag}`, error))
          }
        }

      })

      await host.rta?.subscribe(`https://social.xboxlive.com/users/xuid(${host.profile?.xuid})/friends`)

    }

    const multipleAccounts = this.portal.modules.get('multipleAccounts')

    if (multipleAccounts && multipleAccounts instanceof MultipleAccounts) {
      for (const account of multipleAccounts.peers.values()) {
        addXboxFriend(account)
          .catch(error => this.debug(`Error: ${error.message}`, error))
      }
    }

    addXboxFriend(this.portal.host)
      .catch(error => this.debug(`Error: ${error.message}`, error))

  }

  async stop() {
    super.stop()
  }
}