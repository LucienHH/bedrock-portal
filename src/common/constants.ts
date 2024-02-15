export const SessionConfig = {
  MinecraftTitleID: '896928775',
  MinecraftSCID: '4fc10100-5f7a-4470-899b-280835760c07',
  MinecraftTemplateName: 'MinecraftLobby',
  MiencraftProtocolVersion: 618,
}

export enum Joinability {
  /**
   * Only players who have been invited can join the session.
   * */
  InviteOnly = 'invite_only',
  /**
   * Friends of the authenticating account can join/view the session without an invite.
   * */
  FriendsOnly = 'friends_only',
  /**
   * Anyone that's a friend or friend of a friend can join/view the session without an invite.
   * @default
   * */
  FriendsOfFriends = 'friends_of_friends'
}

export const JoinabilityConfig = {
  [Joinability.InviteOnly]: {
    joinability: Joinability.InviteOnly,
    joinRestriction: 'local',
    broadcastSetting: 1,
  },
  [Joinability.FriendsOnly]: {
    joinability: Joinability.FriendsOnly,
    joinRestriction: 'followed',
    broadcastSetting: 2,
  },
  [Joinability.FriendsOfFriends]: {
    joinability: Joinability.FriendsOfFriends,
    joinRestriction: 'followed',
    broadcastSetting: 3,
  },
}
