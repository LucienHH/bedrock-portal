export interface RESTSessionResponse {
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
    custom: object
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

export interface SessionMember {
  next: number,
  joinTime: string,
  constants: {
    system: {
      initialize: boolean,
      xuid: string,
      index: number

    },
    custom: object
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
    custom: object
  },
  gamertag: string,
  activeTitleId: string
}

export interface SessionConnection {
  ConnectionType: number,
  HostIpAddress: string,
  HostPort: number,
  NetherNetId: bigint,
  WebRTCNetworkId: bigint
}

export interface SessionRequest {
  properties?: {
    system?: {
      joinRestriction?: string,
      readRestriction?: string,
      closed?: boolean,
    },
    custom?: {
      Joinability?: string,
      hostName?: string,
      ownerId?: string,
      rakNetGUID?: string,
      version?: string,
      levelId?: string,
      worldName?: string,
      worldType?: string,
      protocol?: number,
      MemberCount?: number,
      MaxMemberCount?: number,
      BroadcastSetting?: number,
      LanGame?: boolean,
      TransportLayer?: number,
      WebRTCNetworkId?: bigint,
      OnlineCrossPlatformGame?: boolean,
      CrossPlayDisabled?: boolean,
      TitleId?: number,
      isHardcore?: boolean,
      isEditorWorld?: boolean,
      SupportedConnections?: SessionConnection[],
    }
  },
  members?: {
    me?: {
      constants?: { system?: { xuid?: string, initialize?: boolean } },
      properties?: { system?: { active?: boolean, connection?: string, subscription?: { id?: string, changeTypes?: string[] } } }
    } | null
  }
}

export interface SessionHandlePayload {
  version: number,
  type: 'activity' | 'invite',
  sessionRef: {
    scid: string,
    templateName: string,
    name: string,
  },
  inviteAttributes?: {
    titleId: string
    context?: string
    contextString?: string
    senderString?: string
  },
  invitedXuid?: string,
}
