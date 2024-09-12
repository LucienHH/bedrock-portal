import type { RESTSessionResponse, SessionRequest } from './types/sessiondirectory'
import type { Message } from './types/xblmessaging'

import debugFn from 'debug'
import { v4 as uuidV4 } from 'uuid'
import { EventResponse } from 'xbox-rta'
import { Authflow } from 'prismarine-auth'
import { TypedEmitter } from 'tiny-typed-emitter'
import { Server } from 'bedrock-portal-nethernet'

import Host from './classes/Host'
import Player from './classes/Player'
import Module from './classes/Module'

import { SessionConfig, Joinability, JoinabilityConfig } from './common/constants'

import eventHandler from './handlers/Event'

import AutoFriendAdd from './modules/autoFriendAdd'
import InviteOnMessage from './modules/inviteOnMessage'
import RedirectFromRealm from './modules/redirectFromRealm'
import MultipleAccounts from './modules/multipleAccounts'

import { start_game } from './common/start_game'
import { getRandomUint64, isXuid } from './common/util'

const debug = debugFn('bedrock-portal')

type BedrockPortalOptions = {

  /**
   * The ip of the server to redirect users to.
   */
  ip: string,

  /**
   * The port the server is running on.
   * @default 19132
   */
  port: number,

  /**
   * The joinability of the session.
   * @default Joinability.FriendsOfFriends
   * @see {@link Joinability}
   * @example
   * const { BedrockPortal, Joinability } = require('bedrock-portal')
   *
   * portal = new BedrockPortal(auth, {
   *   joinability: Joinability.InviteOnly
   * })
   *
   * portal = new BedrockPortal(auth, {
   *   joinability: Joinability.FriendsOnly
   * })
   *
   * portal = new BedrockPortal(auth, {
   *   joinability: Joinability.FriendsOfFriends
   * })
   */
  joinability: Joinability,

  /**
   * The WebRTC network ID to use for the session.
   */
  webRTCNetworkId: bigint,

  /**
   * The world config to use for the session. Changes the session card which is displayed in the Minecraft client
   */
  world: {


    /**
     * The host name of the world.
     */
    hostName: string,

    /**
     * The name of the world.
     */
    name: string,

    /**
     * The version of the world. Doesn't have to be a real version.
     */
    version: string,

    /**
     * The current player count of the world.
     * @default 0
     */
    memberCount: number,

    /**
     * The max player count of the world. Doesn't affect the session.
     * @default 10
     */
    maxMemberCount: number,

  },
};

interface ExtendedModule {
  new (...args: any[]): Module;
}

interface PortalEvents {
  sessionCreated: (session: RESTSessionResponse) => void
  sessionUpdated: (session: RESTSessionResponse) => void
  rtaEvent: (event: EventResponse) => void
  playerJoin: (player: Player) => void
  playerLeave: (player: Player) => void
  messageRecieved: (message: Message) => void
  friendRemoved: (player: Player) => void
  friendAdded: (player: Player) => void
}

export class BedrockPortal extends TypedEmitter<PortalEvents> {

  public authflow: Authflow

  public host: Host

  public options: BedrockPortalOptions

  public session: { name: string }

  public players: Map<string, Player>

  public modules: Map<string, Module> = new Map()

  constructor(authflow: Authflow, options: Partial<BedrockPortalOptions>) {
    super()

    this.options = {
      ip: '',
      port: 19132,
      joinability: Joinability.FriendsOfFriends,
      webRTCNetworkId: getRandomUint64(),
      ...options,
      world: {
        hostName: 'Bedrock Portal v0.6.0',
        name: 'By LucienHH',
        version: '0.7.1',
        memberCount: 0,
        maxMemberCount: 10,
        ...options.world,
      },
    }

    this.validateOptions(this.options)

    this.authflow = authflow

    this.host = new Host(this, this.authflow)

    this.session = { name: '' }

    this.players = new Map()

    this.modules = new Map()
  }

  validateOptions(options: BedrockPortalOptions) {
    if (!options.ip) throw new Error('No IP provided')
    if (!options.port) throw new Error('No port provided')
    if (!Object.values(Joinability).includes(options.joinability)) throw new Error('Invalid joinability - Expected one of ' + Object.keys(Joinability).join(', '))
  }

  /**
   * Starts the BedrockPortal instance.
   */
  async start() {

    this.players = new Map()

    await this.host.connect()

    this.session.name = uuidV4()

    const server = new Server({
      version: '1.21.20', // The server version
      compressionAlgorithm: 'none',
    })

    server.listen(this.authflow, this.options.webRTCNetworkId)

    server.on('connect', client => {

      client.on('join', () => { // The client has joined the server.

        console.log(`Client ${client.id} has joined the server.`)

        client.write('start_game', start_game)

        client.once('set_player_game_type', () => {
          client.write('transfer', { server_address: this.options.ip, port: this.options.port })
        })

      })
    })

    const session = await this.createAndPublishSession()

    this.host.rta!.on('event', (event) => eventHandler(this, event))

    if (this.modules) {
      for (const mod of this.modules.values()) {
        mod.run(this)
          .then(() => debug(`Module ${mod.name} has run`))
          .catch(e => debug(`Module ${mod.name} failed to run`, e))
      }
    }

    this.emit('sessionCreated', session)
  }

  /**
   * Ends the BedrockPortal instance.
   */
  async end(resume = false) {

    if (this.host.rta) {
      await this.host.rta.destroy()
    }

    await this.host.rest.leaveSession(this.session.name)
      .catch(() => { debug('Failed to leave session as host') })

    if (this.modules) {
      for (const mod of this.modules.values()) {
        debug(`Stopping module: ${mod.name}`)
        await mod.stop()
      }
    }

    debug(`Abandoned session, name: ${this.session.name} - Resume: ${resume}`)

    if (resume) {
      return this.start()
    }
  }

  /**
   * Returns the current members in the session.
   */
  getSessionMembers() {
    return this.players
  }

  /**
   * Invites a player to the BedrockPortal instance.
   * @param identifyer The player's gamertag or XUID.
   */
  async invitePlayer(identifier: string) {
    debug(`Inviting player, identifier: ${identifier}`)

    if (!isXuid(identifier)) {
      const profile = await this.host.rest.getProfile(identifier)
        .catch(() => { throw new Error(`Failed to get profile for identifier: ${identifier}`) })
      identifier = profile.xuid
    }

    await this.host.rest.sendInvite(this.session.name, identifier)

    debug(`Invited player, xuid: ${identifier}`)
  }

  /**
   * Updates the current member count which is displayed in the Minecraft client.
   * @param count The new member count.
   */
  async updateMemberCount(count: number) {
    await this.host.rest.updateMemberCount(this.session.name, count)
  }

  /**
   * Gets the current session of the BedrockPortal instance.
   */
  async getSession() {
    return await this.host.rest.getSession(this.session.name)
  }

  /**
   * Updates the current session of the BedrockPortal instance with the specified payload.
   * @param payload The payload to update the session with.
   */
  async updateSession(payload: SessionRequest) {
    await this.host.rest.updateSession(this.session.name, payload)
  }

  /**
   * Enables a module for the BedrockPortal instance.
   * @see [Modules](https://github.com/LucienHH/bedrock-portal#modules) for a list of available modules or to create your own.
   * @example
   * portal.use(Modules.autoFriendAdd)
   * @example
   * portal.use(Modules.autoFriendAdd, {
   *   inviteOnAdd: true
   * })
   */
  use(mod: ExtendedModule, options = {}) {
    const constructed = new mod()

    debug(`Enabled module: ${constructed.name}`)

    if (!(constructed instanceof Module)) throw new Error('Module must extend the base module')
    if (this.modules.has(constructed.name)) throw new Error(`Module with name ${constructed.name} has already been loaded`)

    constructed.applyOptions(options)

    this.modules.set(constructed.name, constructed)
  }

  private async createAndPublishSession() {

    await this.updateSession(this.createSessionBody())

    debug(`Created session, name: ${this.session.name}, ID: ${this.options.webRTCNetworkId}`)

    await this.host.rest.setActivity(this.session.name)

    const session = await this.getSession()

    await this.updateSession({ properties: session.properties })

    debug(`Published session, name: ${this.session.name}, ID: ${this.options.webRTCNetworkId}`)

    return session
  }

  private createSessionBody(): SessionRequest {

    if (!this.host.profile || !this.host.connectionId) throw new Error('No session owner')

    const joinability = JoinabilityConfig[this.options.joinability]

    return {
      properties: {
        system: {
          joinRestriction: joinability.joinRestriction,
          readRestriction: 'followed',
          closed: false,
        },
        custom: {
          hostName: String(this.options.world.hostName),
          worldName: String(this.options.world.name),
          version: String(this.options.world.version),
          MemberCount: Number(this.options.world.memberCount),
          MaxMemberCount: Number(this.options.world.maxMemberCount),
          Joinability: joinability.joinability,
          ownerId: this.host.profile.xuid,
          rakNetGUID: '',
          worldType: 'Survival',
          protocol: SessionConfig.MiencraftProtocolVersion,
          BroadcastSetting: joinability.broadcastSetting,
          OnlineCrossPlatformGame: true,
          CrossPlayDisabled: false,
          TitleId: 0,
          TransportLayer: 2,
          LanGame: true,
          WebRTCNetworkId: this.options.webRTCNetworkId,
          SupportedConnections: [
            {
              ConnectionType: 3,
              HostIpAddress: '',
              HostPort: 0,
              WebRTCNetworkId: this.options.webRTCNetworkId,
              NetherNetId: this.options.webRTCNetworkId,
            },
          ],
        },
      },
      members: {
        me: {
          constants: {
            system: {
              xuid: this.host.profile.xuid,
              initialize: true,
            },
          },
          properties: {
            system: {
              active: true,
              connection: this.host.connectionId,
              subscription: {
                id: this.host.subscriptionId,
                changeTypes: ['everything'],
              },
            },
          },
        },
      },
    }
  }
}

// Export joinability
export { Joinability } from './common/constants'
export { Module }

const Modules = {
  AutoFriendAdd,
  InviteOnMessage,
  RedirectFromRealm,
  MultipleAccounts,
}

export { Modules }
