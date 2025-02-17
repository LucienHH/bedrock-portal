import axios, { AxiosRequestConfig } from 'axios'

import { Authflow } from 'prismarine-auth'
import { parse, stringify } from 'json-bigint'

import { SessionConfig } from './common/constants'

import { RESTPeoplehubGetFriendRequestResponse, RESTPeoplehubResponse } from './types/peoplehub'
import { RESTXblmessageInboxResponse } from './types/xblmessaging'
import { SessionRequest, RESTSessionResponse, SessionHandlePayload } from './types/sessiondirectory'
import { RESTSocialPostBulkFriendRequestResponse } from './types/social'
import { isXuid } from './common/util'


type RequestHeaders = {
  [x: string]: string | boolean | number | undefined;
}

type MethodRequestConfig = {
  relyingParty?: string,
  contractVersion?: string,
  params?: AxiosRequestConfig['params'],
  data?: AxiosRequestConfig['data'],
  headers?: RequestHeaders,
};

type RequestConfig = MethodRequestConfig & {
  url: string,
};

export default class Rest {

  public auth: Authflow

  public options: {
    headers?: RequestHeaders,
  }

  constructor(authflow: Authflow, options = {}) {
    this.auth = authflow
    this.options = options
  }

  async get(url: string, config: MethodRequestConfig = {}) {
    return await this._request('GET', { url, ...config })
  }

  async post(url: string, config: MethodRequestConfig = {}) {
    return await this._request('POST', { url, ...config })
  }

  async put(url: string, config: MethodRequestConfig = {}) {
    return await this._request('PUT', { url, ...config })
  }

  async delete(url: string, config: MethodRequestConfig = {}) {
    return await this._request('DELETE', { url, ...config })
  }

  async _request(method: 'GET' | 'POST' | 'PUT' | 'DELETE', config: RequestConfig) {
    const auth = await this.auth.getXboxToken('http://xboxlive.com')

    const payload = {
      method,
      url: config.url,
      headers: {
        'authorization': `XBL3.0 x=${auth.userHash};${auth.XSTSToken}`,
        'content-type': 'application/json',
        'accept-language': 'en-US',
        ...config.headers,
      } as RequestHeaders,
      data: undefined,
      params: undefined,
    }

    if (config.contractVersion) payload.headers['x-xbl-contract-version'] = config.contractVersion
    if (config.params) payload.params = config.params
    if (config.data) payload.data = config.data

    return axios({
      ...payload,
      transformResponse: [data => data ? parse(data) : undefined],
      transformRequest: [data => data ? stringify(data) : undefined],
    }).then(e => e.data)
  }

  async sendHandle(payload: SessionHandlePayload) {
    return this.post('https://sessiondirectory.xboxlive.com/handles', {
      data: payload,
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
    const response: RESTSessionResponse = await this.get(`https://sessiondirectory.xboxlive.com/serviceconfigs/${SessionConfig.MinecraftSCID}/sessionTemplates/${SessionConfig.MinecraftTemplateName}/sessions/${sessionName}`, {
      contractVersion: '107',
    })

    return response
  }

  async updateSession(sessionName: string, payload: SessionRequest) {
    const response: RESTSessionResponse = await this.put(`https://sessiondirectory.xboxlive.com/serviceconfigs/${SessionConfig.MinecraftSCID}/sessionTemplates/${SessionConfig.MinecraftTemplateName}/sessions/${sessionName}`, {
      data: payload,
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
      const response = await this.get(`https://profile.xboxlive.com/users/${target}/settings`, { contractVersion: '2' })
      xuid = response.profileUsers[0]!.id
    }

    const response: RESTPeoplehubResponse = await this.get(`https://peoplehub.xboxlive.com/users/me/people/xuids(${xuid})/decoration/detail,preferredcolor`, { contractVersion: '5' })
    return response.people.shift()!
  }

  async getProfiles(xuids: string[]) {
    const response: RESTPeoplehubResponse = await this.post('https://peoplehub.xboxlive.com/users/me/people/batch/decoration/detail,preferredcolor', { data: { xuids }, contractVersion: '5' })
    return response.people
  }

  async getXboxFriends() {
    const response: RESTPeoplehubResponse = await this.get('https://peoplehub.xboxlive.com/users/me/people/social/decoration/detail,preferredColor,follower', { contractVersion: '5' })
    return response.people
  }

  async getXboxFollowers() {
    const response: RESTPeoplehubResponse = await this.get('https://peoplehub.xboxlive.com/users/me/people/followers/decoration/detail,preferredColor,follower', { contractVersion: '5' })
    return response.people
  }

  async getFriendRequestsReceived() {
    const response: RESTPeoplehubGetFriendRequestResponse = await this.get('https://peoplehub.xboxlive.com/users/me/people/friendrequests(received)/decoration/detail,preferredColor,follower', { contractVersion: '7' })
    return response.people
  }

  async acceptFriendRequests(xuids: string[]) {
    const response: RESTSocialPostBulkFriendRequestResponse = await this.post('https://social.xboxlive.com/bulk/users/me/people/friends/v2?method=add', { data: { xuids }, contractVersion: '3' })
    return response
  }

  async declineFriendRequests(xuids: string[]) {
    const response: RESTSocialPostBulkFriendRequestResponse = await this.post('https://social.xboxlive.com/bulk/users/me/people/friends/v2?method=remove', { data: { xuids }, contractVersion: '3' })
    return response
  }

  async addXboxFriend(xuid: string) {
    await this.put(`https://social.xboxlive.com/users/me/people/xuid(${xuid})`, { contractVersion: '2' })
  }

  async removeXboxFriend(xuid: string) {
    await this.delete(`https://social.xboxlive.com/users/me/people/xuid(${xuid})`, { contractVersion: '2' })
  }

  async getInboxMessages(inbox: 'primary' | 'secondary') {
    const response: RESTXblmessageInboxResponse = await this.get(`https://xblmessaging.xboxlive.com/network/xbox/users/me/inbox/${inbox}`, { contractVersion: '1' })
    return response
  }

  async setPresence(xuid: string) {
    await this.post(`https://userpresence.xboxlive.com/users/xuid(${xuid})/devices/current/titles/current`, { data: { state: 'active' } })
  }

}
