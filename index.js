module.exports = {
  BedrockPortal: require('./src/index'),
  Module : require('./src/classes/Module'),
  Modules: {
    autoFriendAdd: require('./src/modules/autoFriendAdd'),
    inviteOnMessage: require('./src/modules/inviteOnMessage'),
    redirectFromRealm: require('./src/modules/redirectFromRealm'),
  },
  Joinability: {
    InviteOnly: 'invite_only',
    FriendsOnly: 'friends_only',
    FriendsOfFriends: 'friends_of_friends',
  },
};
