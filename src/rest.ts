import { Authflow } from 'prismarine-auth'
import { parse, stringify } from 'json-bigint'

import { SessionConfig } from './common/constants'

import { RESTPeoplehubGetFriendRequestResponse, RESTPeoplehubResponse } from './types/peoplehub'
import { RESTXblmessageInboxResponse } from './types/xblmessaging'
import { SessionRequest, RESTSessionResponse, SessionHandlePayload } from './types/sessiondirectory'
import { RESTSocialPostBulkFriendRequestResponse } from './types/social'
import { isXuid } from './common/util'


type RestOptions = {
  headers?: HeadersInit,
}

type FetchJsonInit = RequestInit & {
  contractVersion?: string,
}

export default class Rest {

  public auth: Authflow

  public options: RestOptions

  constructor(authflow: Authflow, options: RestOptions = {}) {
    this.auth = authflow
    this.options = options
  }

  private async fetchJson<T = unknown>(url: string, init: FetchJsonInit = {}) {
    const { contractVersion, headers: requestHeaders, ...requestInit } = init
    const auth = await this.auth.getXboxToken('http://xboxlive.com')

    const headers = new Headers({
      'authorization': `XBL3.0 x=${auth.userHash};${auth.XSTSToken}`,
      'accept-language': 'en-US',
    })

    for (const [key, value] of new Headers(this.options.headers).entries()) {
      headers.set(key, value)
    }

    for (const [key, value] of new Headers(requestHeaders).entries()) {
      headers.set(key, value)
    }

    if (requestInit.body !== undefined && !headers.has('content-type')) {
      headers.set('content-type', 'application/json')
    }

    if (contractVersion) headers.set('x-xbl-contract-version', contractVersion)

    const response = await fetch(url, {
      ...requestInit,
      headers,
    })

    const body = await response.text()

    if (!response.ok) {
      const detail = body ? `: ${body}` : ''
      throw new Error(`Request failed with status ${response.status} ${response.statusText}${detail}`)
    }

    return (body ? parse(body) : undefined) as T
  }

  async sendHandle(payload: SessionHandlePayload) {
    return this.fetchJson('https://sessiondirectory.xboxlive.com/handles', {
      method: 'POST',
      body: stringify(payload),
      contractVersion: '107',
    })
  }

  async setActivity(sessionName: string) {
    return this.sendHandle({
      version: 1,
      type: 'activity',
      sessionRef: { scid: SessionConfig.MinecraftSCID, templateName: SessionConfig.MinecraftTemplateName, name: sessionName },
    })
  }

  async sendInvite(sessionName: string, xuid: string) {
    return this.sendHandle({
      version: 1,
      type: 'invite',
      sessionRef: { scid: SessionConfig.MinecraftSCID, templateName: SessionConfig.MinecraftTemplateName, name: sessionName },
      invitedXuid: xuid,
      inviteAttributes: { titleId: SessionConfig.MinecraftTitleID },
    })
  }

  async getSession(sessionName: string) {
    const response = await this.fetchJson<RESTSessionResponse>(`https://sessiondirectory.xboxlive.com/serviceconfigs/${SessionConfig.MinecraftSCID}/sessionTemplates/${SessionConfig.MinecraftTemplateName}/sessions/${sessionName}`, {
      contractVersion: '107',
    })

    return response
  }

  async updateSession(sessionName: string, payload: SessionRequest) {
    const response = await this.fetchJson<RESTSessionResponse>(`https://sessiondirectory.xboxlive.com/serviceconfigs/${SessionConfig.MinecraftSCID}/sessionTemplates/${SessionConfig.MinecraftTemplateName}/sessions/${sessionName}`, {
      method: 'PUT',
      body: stringify(payload),
      contractVersion: '107',
    })

    return response
  }

  async updateMemberCount(sessionName: string, count: number, maxCount?: number) {
    const payload = maxCount ? { MemberCount: count, MaxMemberCount: maxCount } : { MemberCount: count }
    await this.updateSession(sessionName, { properties: { custom: payload } })
  }

  async addConnection(sessionName: string, xuid: string, connectionId: string, subscriptionId: string) {
    const payload: SessionRequest = {
      members: {
        me: {
          constants: { system: { xuid, initialize: true } },
          properties: {
            system: { active: true, connection: connectionId, subscription: { id: subscriptionId, changeTypes: ['everything'] } },
          },
        },
      },
    }

    await this.updateSession(sessionName, payload)
  }

  async updateConnection(sessionName: string, connectionId: string) {
    const payload: SessionRequest = {
      members: { me: { properties: { system: { active: true, connection: connectionId } } } },
    }

    await this.updateSession(sessionName, payload)
  }

  async leaveSession(sessionName: string) {
    await this.updateSession(sessionName, { members: { me: null } })
  }

  async getProfile(input: string) {
    let xuid = input

    if (!isXuid(input)) {
      const target = input === 'me' ? 'me' : `gt(${encodeURIComponent(input)})`
      const response = await this.fetchJson<{ profileUsers: Array<{ id: string }> }>(`https://profile.xboxlive.com/users/${target}/settings`, { contractVersion: '2' })
      xuid = response.profileUsers[0]!.id
    }

    const response = await this.fetchJson<RESTPeoplehubResponse>(`https://peoplehub.xboxlive.com/users/me/people/xuids(${xuid})/decoration/detail,preferredcolor`, { contractVersion: '5' })
    return response.people.shift()!
  }

  async getProfiles(xuids: string[]) {
    const response = await this.fetchJson<RESTPeoplehubResponse>('https://peoplehub.xboxlive.com/users/me/people/batch/decoration/detail,preferredcolor', {
      method: 'POST',
      body: stringify({ xuids }),
      contractVersion: '5',
    })
    return response.people
  }

  async getXboxFriends() {
    const response = await this.fetchJson<RESTPeoplehubResponse>('https://peoplehub.xboxlive.com/users/me/people/social/decoration/detail,preferredColor,follower', { contractVersion: '5' })
    return response.people
  }

  async getXboxFollowers() {
    const response = await this.fetchJson<RESTPeoplehubResponse>('https://peoplehub.xboxlive.com/users/me/people/followers/decoration/detail,preferredColor,follower', { contractVersion: '5' })
    return response.people
  }

  async getFriendRequestsReceived() {
    const response = await this.fetchJson<RESTPeoplehubGetFriendRequestResponse>('https://peoplehub.xboxlive.com/users/me/people/friendrequests(received)/decoration/detail,preferredColor,follower', { contractVersion: '7' })
    return response.people
  }

  async acceptFriendRequests(xuids: string[]) {
    const response = await this.fetchJson<RESTSocialPostBulkFriendRequestResponse>('https://social.xboxlive.com/bulk/users/me/people/friends/v2?method=add', {
      method: 'POST',
      body: stringify({ xuids }),
      contractVersion: '3',
    })
    return response
  }

  async declineFriendRequests(xuids: string[]) {
    const response = await this.fetchJson<RESTSocialPostBulkFriendRequestResponse>('https://social.xboxlive.com/bulk/users/me/people/friends/v2?method=remove', {
      method: 'POST',
      body: stringify({ xuids }),
      contractVersion: '3',
    })
    return response
  }

  async addXboxFriend(xuid: string) {
    await this.fetchJson(`https://social.xboxlive.com/users/me/people/xuid(${xuid})`, {
      method: 'PUT',
      contractVersion: '2',
    })
  }

  async removeXboxFriend(xuid: string) {
    await this.fetchJson(`https://social.xboxlive.com/users/me/people/xuid(${xuid})`, {
      method: 'DELETE',
      contractVersion: '2',
    })
  }

  async getInboxMessages(inbox: 'primary' | 'secondary') {
    const response = await this.fetchJson<RESTXblmessageInboxResponse>(`https://xblmessaging.xboxlive.com/network/xbox/users/me/inbox/${inbox}`, { contractVersion: '1' })
    return response
  }

  async setPresence(xuid: string) {
    await this.fetchJson(`https://userpresence.xboxlive.com/users/xuid(${xuid})/devices/current/titles/current`, {
      method: 'POST',
      body: stringify({ state: 'active' }),
    })
  }

}
