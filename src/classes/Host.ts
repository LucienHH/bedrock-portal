import debugFn from 'debug'
import { v4 as uuidV4 } from 'uuid'
import { Authflow } from 'prismarine-auth'
import { EventResponse, XboxRTA } from 'xbox-rta'

import { BedrockPortal } from '..'

import { Person } from '../types/peoplehub'
import Rest from '../rest'

const debug = debugFn('bedrock-portal')

export default class Host {

  public portal: BedrockPortal

  public authflow: Authflow

  public rest: Rest

  public rta: XboxRTA | null = null

  public profile: Person | null = null

  public connectionId: string | null = null

  public subscriptionId: string = uuidV4()

  public presenceInterval: NodeJS.Timeout | null = null

  constructor(portal: BedrockPortal, authflow: Authflow) {

    this.portal = portal

    this.authflow = authflow

    this.rest = new Rest(this.authflow)

  }

  async connect() {

    let rta: XboxRTA | null = null
    let presenceInterval: NodeJS.Timeout | null = null

    try {

      const auth = await this.authflow.getXboxToken()

      const profile = await this.rest.getProfile(auth.userXUID)

      rta = new XboxRTA(this.authflow)

      await rta.connect()

      const subResponse = await rta.subscribe('https://sessiondirectory.xboxlive.com/connections/')

      const subData = subResponse.data as { ConnectionId?: string }

      this.profile = profile
      this.rta = rta
      this.connectionId = subData.ConnectionId ?? null
      this.subscriptionId = uuidV4()

      this.rta.on('subscribe', (event: EventResponse) => this.onSubscribe(event))

      if (this.portal.options.updatePresence) {
        const updatePresence = () => {
          if (this.profile) {
            this.rest.setPresence(this.profile.xuid)
              .catch(e => { debug('Failed to set presence', e) })
          }
        }

        presenceInterval = setInterval(updatePresence, 300000)

        this.presenceInterval = presenceInterval

        updatePresence()
      }

    }
    catch (e) {
      if (presenceInterval) {
        clearInterval(presenceInterval)
      }

      if (rta) {
        await rta.destroy()
          .catch(error => { debug('Failed to destroy host RTA during connect cleanup', error) })
      }

      this.rta = null
      this.profile = null
      this.connectionId = null
      this.presenceInterval = null
      this.subscriptionId = uuidV4()

      throw e
    }

  }

  async disconnect() {
    const rta = this.rta
    const presenceInterval = this.presenceInterval
    const sessionName = this.portal.session.name

    this.rta = null
    this.profile = null
    this.connectionId = null
    this.presenceInterval = null
    this.subscriptionId = uuidV4()

    if (presenceInterval) {
      clearInterval(presenceInterval)
    }

    if (rta) {
      await rta.destroy()
    }

    if (sessionName) {
      await this.rest.leaveSession(sessionName)
    }

    debug('Successfully disconnected host', this.authflow.username)
  }

  private async onSubscribe(event: EventResponse) {

    const connectionId = (event.data as { ConnectionId?: string } | undefined)?.ConnectionId

    if (connectionId && typeof connectionId === 'string') {

      debug('Received RTA subscribe event', event)

      try {
        this.connectionId = connectionId

        if (!this.portal.session.name) {
          return
        }

        await this.rest.updateConnection(this.portal.session.name, connectionId)
        await this.rest.setActivity(this.portal.session.name)
      }
      catch (e) {
        debug('Failed to update connection, session may have been abandoned', e)
        await this.portal.end(true)
      }
    }
  }

}
