import type { Person } from '../types/peoplehub'
import type { SessionMember } from '../types/sessiondirectory'

type PlayerSession = {
  titleId: string,
  joinTime: string,
  index: number,
  connectionId: string,
  subscriptionId: string,
}

export default class Player {

  public profile: Partial<Person>

  public session: Partial<PlayerSession>

  constructor(profileData: Person | null, sessionData: SessionMember | null) {

    this.profile = {}
    this.session = {}

    if (profileData) {
      this.profile = profileData
    }

    if (sessionData) {
      this.session = {
        titleId: sessionData.activeTitleId,
        joinTime: sessionData.joinTime,
        index: sessionData.constants.system.index,
        connectionId: sessionData.properties.system.connection,
        subscriptionId: sessionData.properties.system.subscription?.id,
      }
    }
  }
}
