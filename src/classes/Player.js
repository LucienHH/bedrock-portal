class Player {
  constructor(profileData = {}, sessionData = {}) {
    this.profile = {};
    this.session = {};
    this.setXboxProfile(profileData);
    this.setSessionMember(sessionData);
  }

  static fromSessionMember(data) {
    return new Player(null, data);
  }

  static fromXboxProfile(data) {
    return new Player(data, null);
  }

  setXboxProfile(data) {
    Object.assign(this.profile, {
      xuid: data.xuid,
      avatar: data.avatar,
      gamerscore: data.gamerscore,
      gamertag: data.gamertag,
      tier: data.tier,
      reputation: data.reputation,
      colour: data.colour,
      realname: data.realname,
      bio: data.bio,
      location: data.location,
      modernGamertag: data.modernGamertag,
      modernGamertagSuffix: data.modernGamertagSuffix,
      uniqueModernGamertag: data.uniqueModernGamertag,
      realnameOverride: data.realnameOverride,
      tenureLevel: data.tenureLevel,
      watermarks: data.watermarks,
      isQuarantined: data.isQuarantined,
      linkedAccounts: data.linkedAccounts,
    });
  }

  setSessionMember(data) {
    Object.assign(this.session, {
      titleId: data.activeTitleId,
      joinTime: data.joinTime,
      index: data.constants.system.index,
      connectionId: data.properties.system.connection,
      subscriptionId: data.properties.system.subscription?.id,
    });
  }

}

module.exports = Player;
