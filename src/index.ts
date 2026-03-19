import type { RESTSessionResponse, SessionRequest } from './types/sessiondirectory'
import type { Message } from 'xbox-message'

import debugFn from 'debug'
import { v4 as uuidV4 } from 'uuid'
import { EventResponse } from 'xbox-rta'
import { TypedEmitter } from 'tiny-typed-emitter'
import { Server } from 'bedrock-portal-nethernet'
import { Authflow, CacheFactory, MicrosoftAuthFlowOptions, Titles, ServerDeviceCodeResponse } from 'prismarine-auth'

import Host from './classes/Host'
import Player from './classes/Player'
import Module from './classes/Module'

import { SessionConfig, Joinability, JoinabilityConfig } from './common/constants'

import eventHandler from './handlers/Event'

import AutoFriendAdd from './modules/autoFriendAdd'
import InviteOnMessage from './modules/inviteOnMessage'
import RedirectFromRealm from './modules/redirectFromRealm'
import AutoFriendAccept from './modules/autoFriendAccept'
import UpdateMemberCount from './modules/updateMemberCount'
import ServerFromList from './modules/serverFormList'

import { start_game } from './common/start_game'
import { getRandomUint64, isXuid } from './common/util'

const debug = debugFn('bedrock-portal')

type AuthflowOptions = {
  username?: string;
  cache?: string | CacheFactory;
  options?: MicrosoftAuthFlowOptions;
  onMsaCode?: (res: ServerDeviceCodeResponse) => void;
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
   * The authflow options or authflow instance to use for the host account.
   */
  host: AuthflowOptions | Authflow,

  /**
    * Additional accounts which are connected to the session and can be used to join the portal..
    * @default []
    */
  peers: (AuthflowOptions | Authflow)[],

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

const getDefaultAuthflowOptions = (options: AuthflowOptions = {}): AuthflowOptions => ({
  username: 'BedrockPortal',
  cache: './',
  options: {
    authTitle: Titles.MinecraftIOS,
    flow: 'sisu',
    deviceType: 'iOS',
  },
  onMsaCode: (res: ServerDeviceCodeResponse) => {
    console.log(`${options.username} - ${res.message}`)
  },
  ...options,
})

export class BedrockPortal extends TypedEmitter<PortalEvents> {

  public host: Host

  public options: BedrockPortalOptions

  public session: { name: string }

  public players: Map<string, Player>

  public peers: Map<string, Host>

  public modules: Map<string, Module> = new Map()

  public server = new Server()

  constructor(options: Partial<Omit<BedrockPortalOptions, "world"> & { world?: Partial<BedrockPortalOptions["world"]> }> = {}) {
    super()

    this.options = {
      ip: '',
      port: 19132,
      joinability: Joinability.FriendsOfFriends,
      webRTCNetworkId: getRandomUint64(),
      updatePresence: true,
      ...options,
      host: options.host instanceof Authflow ? options.host : getDefaultAuthflowOptions(options.host),
      peers: options.peers ? options.peers.map(peer => peer instanceof Authflow ? peer : getDefaultAuthflowOptions(peer)) : [],
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

    this.host = new Host(
      this,
      this.options.host instanceof Authflow ? this.options.host : new Authflow(this.options.host.username, this.options.host.cache, this.options.host.options, this.options.host.onMsaCode),
    )

    this.session = { name: '' }

    this.players = new Map()

    this.peers = new Map()

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

    await this.server.listen(this.host.authflow, this.options.webRTCNetworkId)

    this.server.on('connect', (client) => this.onServerConnection(client))

    const session = await this.createAndPublishSession()

    await this.connectPeers()

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

    if (this.modules) {
      for (const mod of this.modules.values()) {
        debug(`Stopping module: ${mod.name}`)
        await mod.stop()
      }
    }

    await this.disconnectPeers()

    await this.host.disconnect()

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

  getHostAndPeers() {
    return [this.host, ...this.peers.values()]
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
        has_addons: false,
        has_scripts: false,
        disable_vibrant_visuals: false,
        world_template: {
          uuid: '',
          version: '',
        },
        texture_packs: [],
      })

      client.write('resource_pack_stack', {
        must_accept: false,
        resource_packs: [],
        game_version: '*',
        experiments: [],
        experiments_previously_used: false,
        has_editor_packs: false,
      })

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

  private async connectPeers() {

    for (const account of this.options.peers) {

      let peer: Host | null = null

      try {

        peer = new Host(this, account instanceof Authflow ? account : new Authflow(account.username, account.cache, account.options, account.onMsaCode))

        await peer.connect()

        if (!peer.profile || !peer.connectionId) {
          throw Error(`Failed to connect to ${account.username}`)
        }

        debug(`Connected ${peer.profile.gamertag}`)

        const hostAddPeer = await this.host.rest.addXboxFriend(peer.profile.xuid)
          .then(() => null)
          .catch(error => error)

        const peerAddHost = await peer.rest.addXboxFriend(this.host.profile!.xuid)
          .then(() => null)
          .catch(error => error)

        if (hostAddPeer || peerAddHost) {
          if (hostAddPeer) debug(`Failed to add ${peer.profile.gamertag} as a friend - ${hostAddPeer.message}`)
          if (peerAddHost) debug(`Failed to add ${this.host.profile!.gamertag} as a friend - ${peerAddHost.message}`)
          throw Error(`Failed to create friendship between ${this.host.profile!.gamertag} and ${peer.profile.gamertag}`)
        }

        await peer.rest.addConnection(this.session.name, peer.profile.xuid, peer.connectionId, peer.subscriptionId)

        await peer.rest.setActivity(this.session.name)

        this.peers.set(peer.profile.xuid, peer)

      }
      catch (error: any) {
        debug(`Failed to initialise ${account.username} - ${error.message}`)

        if (peer) {
          await peer.disconnect()
            .catch((err) => debug(`Failed to disconnect ${peer?.authflow.username ?? account.username}`, err))
        }
      }

    }
  }

  private async disconnectPeers() {
    for (const peer of this.peers.values()) {

      await peer.disconnect()
        .catch((err) => debug(`Failed to disconnect ${peer.authflow.username}`, err))
    }

    this.peers.clear()
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
  AutoFriendAccept,
  UpdateMemberCount,
  ServerFromList,
}

export { Modules }
