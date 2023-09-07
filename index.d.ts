/// <reference types="node" />
import { EventEmitter } from 'events';
import { Authflow } from 'prismarine-auth';
declare module 'bedrock-portal' {
  export class BedrockPortal extends EventEmitter {
    /**
     * Handles and creates a Minecraft Bedrock game session which will redirect players to the specified server.
     * @param authflow An Authflow instance from [prismarine-auth](https://github.com/PrismarineJS/prismarine-auth).
     * @param options Options for the BedrockPortal instance
     */
    constructor(authflow: Authflow, options: BedrockPortalOptions = {})

    /**
     * Starts the BedrockPortal instance.
     */
    start(): Promise<SessionResponse>

    /**
     * Ends the BedrockPortal instance.
     */
    end(): Promise<void>

    /**
     * Returns the current members in the session.
     */
    getSessionMembers(): Promise<Player[]>

    /**
     * Invites a player to the BedrockPortal instance.
     * @param identifyer The player's gamertag or XUID.
     */
    invitePlayer(identifyer: string): Promise<void>

    /**
     * Updates the current member count which is displayed in the Minecraft client.
     * @param count The new member count.
     */
    updateMemberCount(count: number): Promise<void>

    /**
     * Updates the connectionId of the BedrockPortal instance. Used internally on reconnect.
     * @param connectionId The new connectionId.
     */
    updateConnection(connectionId: string): Promise<void>

    /**
     * Gets the current session of the BedrockPortal instance.
     */
    getSession(): Promise<SessionResponse>

    /**
     * Updates the current session of the BedrockPortal instance with the specified payload.
     * @param payload The payload to update the session with.
     */
    updateSession(payload: SessionRequest): Promise<void>

    /**
     * Used to set the session for the user's current activity and to invite session members if required
     * @param payload The payload 
     */
    updateHandle(payload: HandlePayload): Promise<void>

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
    use(module: InstanceType<typeof ExtendedModule>, options?: any): void

    /**
     * Emitted when the BedrockPortal session is created.
     * @example
     * portal.on('sessionCreated', (session) => {
     *   console.log(`Session created!`, session)
     * })
     */
    on(event: 'sessionCreated', listener: (session: SessionResponse) => void): this;

    /**
     * Emitted when the BedrockPortal session is updated.
     * @example
     * portal.on('sessionUpdated', (session) => {
     *  console.log(`Session updated!`, session)
     * })
     */
    on(event: 'sessionUpdated', listener: (session: SessionResponse) => void): this;
  
    /**
     * Emitted when a player joins the BedrockPortal instance.
     * @param data The player's data.
     * @example
     * portal.on('playerJoin', (data) => {
     *  console.log(`${data.profile.gamertag} joined!`)
     * })
     */
    on(event: 'playerJoin', listener: (data: InstanceType<typeof Player>) => void): this;

    /**
     * Emitted when a player leaves the BedrockPortal instance.
     * @param data The player's data.
     * @example
     * portal.on('playerLeave', (data) => {
     *  console.log(`${data.profile.gamertag} left!`)
     * })
     */
    on(event: 'playerLeave', listener: (data: InstanceType<typeof Player>) => void): this;

    /**
     * Emitted when the RTA service receives an event.
     * @param data The RTA event data.
     */
    on(event: 'rtaEvent', listener: (data: RTAEvent) => void): this;

    /**
     * Emitted when a player is added back via the AutoFriendAdd module.
     * @param data The player's data.
     * @example
     * portal.on('friendAdded', (data) => {
     *   console.log(`Added ${data.gamertag} back!`)
     * })
     */
    on(event: 'friendAdded', listener: (data: InstanceType<typeof Player>) => void): this;

  }

  export class Player {
    constructor(profileData?: XboxPlayerProfile, sessionData?: SessionMember)
    profile?: Partial<XboxPlayerProfile>
    session?: Partial<{
      titleId: string
      joinTime: string
      index: number
      connectionId: string
      subscriptionId: string
    }>
    
    static fromXboxProfile(data: XboxPlayerProfile): InstanceType<typeof Player>
    static fromSessionMember(data: SessionMember): InstanceType<typeof Player>

    setXboxProfile(data: XboxPlayerProfile): void
    setSessionMember(data: SessionMember): void
  }

  export class Module {
    constructor(name: string, description: string)
    name: string
    description: string
    options: any
    stopped: boolean
    debug(...args: any[]): void
    applyOptions(options: any): void
    stop(): void
  }

  class ExtendedModule extends Module {
    constructor()
    run(portal: BedrockPortal, { rest, rta }: { rest: any, rta: any }): Promise<void>
  }

  export const Modules: {
    /**
     * Automatically adds players back as friends and invites them to the session.
     * @example
     * portal.use(Modules.autoFriendAdd)
     * @example
     * portal.use(Modules.autoFriendAdd, {
     *   inviteOnAdd: true
     * })
     */
    autoFriendAdd: InstanceType<typeof ExtendedModule>
    inviteOnMessage: InstanceType<typeof ExtendedModule>
    redirectFromRealm: InstanceType<typeof ExtendedModule>
  }

  export interface RTAEvent {
    type: number;
    subId: number;
    data: {
      ncid: string,
      shoulderTaps: {
        timestamp: string,
        subscription: string,
        resourceType: string,
        resource: string,
        branch: string,
        changeNumber: number
      }[]
    }
  }

  export interface SessionProfile {
    profile: {
      xuid: string
      gamertag: string
      avatar: string
      gamerscore: string
      colour: {
        primaryColour: string
        secondaryColour: string
        tertiaryColour: string
      }
    },
    session: {
      titleId: string
      joinTime: string
      index: string
      connectionId: string
      subscriptionId: string
    }
  }

  export interface BedrockPortalOptions {
    /**
     * The ip of the server to redirect users to.
     */
    ip: string
    /**
     * The port the server is running on.
     * @default 19132
     */
    port?: number
    /**
     * If true disables the alt check
     * @default false
     * @warning We recommend using an alt account with BedrockPortal instead of disabling the alt check.
     */
    disableAltCheck?: boolean
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
     *   joinability: Joinability.FriendOnly
     * })
     * 
     * portal = new BedrockPortal(auth, {
     *   joinability: Joinability.FriendsOfFriends
     * })
     */
    joinability?: Joinability
    /**
     * The world config to use for the session. Changes the session card which is displayed in the Minecraft client
     */
    world?: {
      /**
       * The name of the world.
       */
      name?: string
      /**
       * The host name of the world.
       */
      hostName?: string
      /**
       * The version of the world. Doesn't have to be a real version.
       */
      version?: string
      /**
       * The current player count of the world.
       * @default 0
       */
      memberCount?: number
      /**
       * The max player count of the world. Doesn't affect the session.
       * @default 10
       */
      maxMemberCount?: number
    }
  }

  export enum Joinability {
    /**
     * Only players who have been invited can join the session.
     * */
    InviteOnly = 'invite_only',
    /**
     * Friends of the authenticating account can join/view the session without an invite.
     * */
    FriendOnly = 'friends_only',
    /**
     * Anyone that's a friend or friend of a friend can join/view the session without an invite.
     * @default
     * */
    FriendsOfFriends = 'friends_of_friends'
  }

  export interface HandlePayload {
    version: number,
    type: 'activity' | 'invite',
    sessionRef: {
      scid: string,
      templateName: string,
      name: string,
    },
    inviteAttributes?: {
      titleId: string
      context: string
      contextString: string
      senderString: string
    },
    invitedXuid?: string,
  }

  export interface SessionResponse {
    membersInfo: {
      first: number,
      next: number,
      count: number,
      accepted: number,
      active: number
    },
    constants: {
      system: {
        readyRemovalTimeout: number,
        reservedRemovalTimeout: number,
        sessionEmptyTimeout: number,
        inactiveRemovalTimeout: number,
        version: number,
        maxMembersCount: number,
        visibility: string,
        capabilities: {
          connectivity: boolean,
          connectionRequiredForActiveMembers: boolean,
          gameplay: boolean,
          crossPlay: boolean,
          userAuthorizationStyle: boolean
        },
        inviteProtocol: string,
        memberInitialization: {
          membersNeededToStart: number,
        }
      },
      custom: {}
    },
    properties: {
      system: {
        joinRestriction: 'followed' | 'local',
        readRestriction: string,
        turn: []
      },
      custom: {
        Joinability: string,
        hostName: string,
        ownerId: string,
        rakNetGUID: string,
        version: string,
        worldName: string,
        worldType: string,
        protocol: number,
        MemberCount: number,
        MaxMemberCount: number,
        BroadcastSetting: number,
        UsesWebSocketsWebRTCSignaling: boolean,
        UsesMPSDWebRTCSignaling: boolean,
        netherNetEnabled: boolean,
        OnlineCrossPlatformGame: boolean,
        CrossPlayDisabled: boolean,
        TitleId: number,
        SupportedConnections: SessionConnection[],
        levelId: string,
        LanGame: boolean
      }
    },
    servers: {},

    // all objects withing this object have the same structure
    members: {
      [index: number]: SessionMember
    }
    correlationId: string,
    contractVersion: number,
    branch: string,
    changeNumber: number,
    startTime: string
  }

  export interface SessionRequest {
    properties: {
      system: {
        joinRestriction: 'followed' | 'local',
        readRestriction: string,
        closed: boolean,
      },
      custom: {
        Joinability: string,
        hostName: string,
        ownerId: string,
        rakNetGUID: string,
        version: string,
        levelId: string,
        worldName: string,
        worldType: string,
        protocol: number,
        MemberCount: number,
        MaxMemberCount: number,
        BroadcastSetting: number,
        LanGame: boolean,
        TransportLayer: number,
        WebRTCNetworkId: number,
        OnlineCrossPlatformGame: boolean,
        CrossPlayDisabled: boolean,
        TitleId: number,
        SupportedConnections: SessionConnection[],
      }
    },
    members: {
      me: {
        constants: {
          system: {
            xuid: string,
            initialize: boolean
          }
        },
        properties: {
          system: {
            active: boolean,
            connection: string,
            subscription: {
              id: string,
              changeTypes: string[]
            }
          }
        }
      }
    }
  }

  export interface SessionMember {
    next: number,
    joinTime: string,
    constants: {
      system: {
        initialize: boolean,
        xuid: string,
        index: number

      },
      custom: {}
    },
    properties: {
      system: {
        subscription: {
          id: string,
          changeTypes: string[]
        },
        active: boolean,
        connection: string
      },
      custom: {}
    },
    gamertag: string,
    activeTitleId: string
  }

  export interface SessionConnection {
    ConnectionType: number,
    HostIpAddress: string,
    HostPort: number,
    RakNetGUID: string,
  }

  export interface XboxPlayerProfile {
    xuid: string,
    avatar: string,
    gamerscore: string,
    gamertag: string,
    tier: string,
    reputation: string,
    colour: {
      primaryColour: string,
      secondaryColour: string,
      tertiaryColour: string
    },
    realname: string,
    bio: string,
    location: string,
    modernGamertag: string,
    modernGamertagSuffix: string,
    uniqueModernGamertag: string,
    realnameOverride: string,
    tenureLevel: string,
    watermarks: string,
    isQuarantined: boolean,
    linkedAccounts: []
  }

}
