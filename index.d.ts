/// <reference types="node" />
import { EventEmitter } from 'events';
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
    getSessionMembers(): Promise<SessionMember[]>

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

    on(event: 'playersAdded', listener: (data: SessionMember[]) => void): this;
    on(event: 'playersRemoved', listener: (data: SessionMember[]) => void): this;
    on(event: 'rtaEvent', listener: (data: RTAEvent) => void): this;
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

  export interface SessionMember {
    profile: { 
      xuid: string
      gamertag: string
      avatar: string
      gamerscore: string
      colour: {
        primaryColor: string
        secondaryColor: string
        tertiaryColor: string
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
    ip: string
    port: number
    disableAltCheck?: boolean
    joinability?: 'invite_only' | 'friends_only' | 'friends_of_friends'
    world?: {
      hostName?: string
			name?: string
			version?: string
			memberCount?: number
			maxMemberCount?: number
    }
    modules?: {
      autoFriendAdd?: boolean
    }
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

}
