const Endpoints = {
  Handle: 'https://sessiondirectory.xboxlive.com/handles',
  ServiceConfigs: 'https://sessiondirectory.xboxlive.com/serviceconfigs',
};

const SessionConfig = {
  MinecraftTitleID: '896928775',
  MinecraftSCID: '4fc10100-5f7a-4470-899b-280835760c07',
  MinecraftTemplateName: 'MinecraftLobby',
  MiencraftProtocolVersion: 618,
};

const Joinability = {
  invite_only: {
    joinability: 'invite_only',
    joinRestriction: 'local',
    broadcastSetting: 1,
  },
  friends_only: {
    joinability: 'joinable_by_friends',
    joinRestriction: 'followed',
    broadcastSetting: 2,
  },
  friends_of_friends: {
    joinability: 'joinable_by_friends',
    joinRestriction: 'followed',
    broadcastSetting: 3,
  },
};

module.exports = {
  Endpoints,
  SessionConfig,
  Joinability,
};
