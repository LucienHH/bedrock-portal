import type { RESTSessionResponse, SessionRequest } from './types/sessiondirectory'
import type { Message } from 'xbox-message'

import debugFn from 'debug'
import { v4 as uuidV4 } from 'uuid'
import { EventResponse } from 'xbox-rta'
import { TypedEmitter } from 'tiny-typed-emitter'
import { Server } from 'bedrock-portal-nethernet'
import { Authflow, CacheFactory, MicrosoftAuthFlowOptions, Titles } from 'prismarine-auth'

import Host from './classes/Host'
import Player from './classes/Player'
import Module from './classes/Module'

import { SessionConfig, Joinability, JoinabilityConfig } from './common/constants'

import eventHandler from './handlers/Event'

import AutoFriendAdd from './modules/autoFriendAdd'
import InviteOnMessage from './modules/inviteOnMessage'
import RedirectFromRealm from './modules/redirectFromRealm'
import MultipleAccounts from './modules/multipleAccounts'
import AutoFriendAccept from './modules/autoFriendAccept'
import UpdateMemberCount from './modules/updateMemberCount'
import ServerFromList from './modules/serverFormList'

import { start_game } from './common/start_game'
import { getRandomUint64, isXuid } from './common/util'

const debug = debugFn('bedrock-portal')

type AuthflowOptions = {
  username: string;
  cache: string | CacheFactory;
  options: MicrosoftAuthFlowOptions;
};

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
   * Whether or not to update the presence of the host. If true the account will be displayed as playing Minecraft in the Xbox app.
   * @default true
   */
  updatePresence: boolean,

  /**
   * The authentication flow to use for the session.
   */
  authflow: AuthflowOptions | Authflow,

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

    /**
     * Whether or not the world is hardcore.
     * @default false
     */
    isHardcore: boolean,

    /**
     * Whether or not the world is an editor world.
     * @default false
     */
    isEditor: boolean,

  },
};

interface ExtendedModule extends Module {
  options: any;
}

type ExtendedModuleConstructor<T extends ExtendedModule> = new (...args: any[]) => T;

interface PortalEvents {
  sessionCreated: (session: RESTSessionResponse) => void
  sessionUpdated: (session: RESTSessionResponse) => void
  rtaEvent: (event: EventResponse) => void
  playerJoin: (player: Player) => void
  playerLeave: (player: Player) => void
  messageRecieved: (message: Message) => void
  messageReceived: (message: Message) => void
  friendRemoved: (player: Player) => void
  friendAdded: (player: Player) => void
  memberCountUpdate: (data: { online: number, max: number, cycle: number }) => void
}

export class BedrockPortal extends TypedEmitter<PortalEvents> {

  public authflow: Authflow

  public host: Host

  public options: BedrockPortalOptions

  public session: { name: string }

  public players: Map<string, Player>

  public modules: Map<string, Module> = new Map()

  public server = new Server()

  constructor(options: Partial<BedrockPortalOptions> = {}) {
    super()

    this.options = {
      ip: '',
      port: 19132,
      joinability: Joinability.FriendsOfFriends,
      webRTCNetworkId: getRandomUint64(),
      updatePresence: true,
      ...options,
      authflow: options.authflow instanceof Authflow ? options.authflow : {
        username: 'BedrockPortal',
        cache: './',
        options: {
          authTitle: Titles.MinecraftIOS,
          flow: 'sisu',
          deviceType: 'iOS',
        },
        ...options.authflow,
      },
      world: {
        hostName: 'Bedrock Portal v1.0.0',
        name: 'By LucienHH',
        version: '1.0.0',
        memberCount: 1,
        maxMemberCount: 10,
        isHardcore: false,
        isEditor: false,
        ...options.world,
      },
    }

    this.validateOptions(this.options)

    this.authflow = this.options.authflow instanceof Authflow ? this.options.authflow : new Authflow(this.options.authflow.username, this.options.authflow.cache, this.options.authflow.options)

    this.host = new Host(this, this.authflow)

    this.session = { name: '' }

    this.players = new Map()

    this.modules = new Map()
  }

  validateOptions(options: BedrockPortalOptions) {
    if (!Object.values(Joinability).includes(options.joinability)) throw new Error('Invalid joinability - Expected one of ' + Object.keys(Joinability).join(', '))
    if (options.world.memberCount <= 0) throw new Error('Invalid member count - Expected a number greater than 0')
  }

  /**
   * Starts the BedrockPortal instance.
   */
  async start() {

    this.players = new Map()

    await this.host.connect()

    this.session.name = uuidV4()

    await this.server.listen(this.authflow, this.options.webRTCNetworkId)

    this.server.on('connect', (client) => this.onServerConnection(client))

    const session = await this.createAndPublishSession()

    this.host.rta!.on('event', (event) => {
      eventHandler(this, event)
        .catch(e => debug('Failed to handle event', e))
    })

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

    await this.host.disconnect()

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
   * @param maxCount The new max member count.
   */
  async updateMemberCount(count: number, maxCount?: number) {
    if (count <= 0) count = 1
    await this.host.rest.updateMemberCount(this.session.name, count, maxCount)
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

  use<T extends ExtendedModule>(mod: ExtendedModuleConstructor<T>, options?: Partial<T['options']>) {

    if (this.host.connectionId) throw new Error('Cannot add modules after the portal has started. Call #.use(...) before calling #.start()')

    const constructed = new mod(this)

    debug(`Enabled module: ${constructed.name}`)

    if (!(constructed instanceof Module)) throw new Error('Module must extend the base module')
    if (this.modules.has(constructed.name)) throw new Error(`Module with name ${constructed.name} has already been loaded`)

    constructed.applyOptions(options)

    this.modules.set(constructed.name, constructed)
  }

  onServerConnection = (client: any) => {

    client.on('join', () => {

      client.write('resource_packs_info', {
        must_accept: false,
        has_scripts: false,
        behaviour_packs: [],
        world_template: { uuid: '550e8400-e29b-41d4-a716-446655440000', version: '' },
        texture_packs: [],
        resource_pack_links: [],
      })

      client.write('resource_pack_stack', { must_accept: false, behavior_packs: [], resource_packs: [], game_version: '', experiments: [], experiments_previously_used: false })

      client.once('resource_pack_client_response', () => {
        client.write('start_game', start_game)

        client.once('set_player_game_type', () => {
          client.write('transfer', { server_address: this.options.ip, port: this.options.port })
        })
      })

    })

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
          isHardcore: this.options.world.isHardcore,
          isEditorWorld: this.options.world.isEditor,
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
  AutoFriendAccept,
  UpdateMemberCount,
  ServerFromList,
}

export { Modules }
