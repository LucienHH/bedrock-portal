import type { BedrockPortal } from '../index'
import type { FriendRequestPerson } from '../types/peoplehub'
import type { EventResponse } from 'xbox-rta'

import Module from '../classes/Module'
import Player from '../classes/Player'
import Host from '../classes/Host'

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

  public listeners: Map<string, { host: Host, listener: (event: EventResponse) => Promise<void> }>

  constructor(portal: BedrockPortal) {
    super(portal, 'autoFriendAccept', 'Automatically accept friend requests')

    this.options = {
      inviteOnAdd: false,
      conditionToMeet: () => true,
    }

    this.listeners = new Map()
  }

  async run() {

    const addXboxFriend = async (host: Host) => {

      if (!host.rta || !host.profile || this.listeners.has(host.authflow.username)) {
        return
      }

      const listener = async (event: EventResponse) => {

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

      }

      this.listeners.set(host.authflow.username, { host, listener })

      host.rta.on('event', listener)

      await host.rta.subscribe(`https://social.xboxlive.com/users/xuid(${host.profile.xuid})/friends`)

    }

    for (const account of this.portal.getHostAndPeers()) {
      addXboxFriend(account)
        .catch(error => this.debug(`Error: ${error.message}`, error))
    }

  }

  async stop() {
    super.stop()

    for (const { host, listener } of this.listeners.values()) {
      host.rta?.removeListener('event', listener)
    }

    this.listeners.clear()
  }
}