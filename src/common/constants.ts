export const SessionConfig = {
  MinecraftTitleID: '896928775',
  MinecraftSCID: '4fc10100-5f7a-4470-899b-280835760c07',
  MinecraftTemplateName: 'MinecraftLobby',
  MiencraftProtocolVersion: 860,
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
    joinability: 'invite_only',
    joinRestriction: 'local',
    broadcastSetting: 1,
  },
  [Joinability.FriendsOnly]: {
    joinability: 'joinable_by_friends',
    joinRestriction: 'followed',
    broadcastSetting: 2,
  },
  [Joinability.FriendsOfFriends]: {
    joinability: 'joinable_by_friends',
    joinRestriction: 'followed',
    broadcastSetting: 3,
  },
}
