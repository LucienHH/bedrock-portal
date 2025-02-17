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

    const auth = await this.authflow.getXboxToken()

    this.profile = await this.rest.getProfile(auth.userXUID)

    this.rta = new XboxRTA(this.authflow)

    await this.rta.connect()

    const subResponse = await this.rta.subscribe('https://sessiondirectory.xboxlive.com/connections/')

    this.connectionId = (subResponse.data as any).ConnectionId

    this.rta.on('subscribe', (event: EventResponse) => this.onSubscribe(event))

    if (this.portal.options.updatePresence) {
      const updatePresence = () => {
        if (this.profile) {
          this.rest.setPresence(this.profile.xuid)
            .catch(e => { debug('Failed to set presence', e) })
        }
      }

      this.presenceInterval = setInterval(updatePresence, 300000)

      updatePresence()
    }

  }

  async disconnect() {
    if (this.rta) {
      await this.rta.destroy()
    }

    if (this.presenceInterval) {
      clearInterval(this.presenceInterval)
    }

    await this.rest.leaveSession(this.portal.session.name)
      .catch(() => { debug('Failed to leave session as host') })
  }

  private async onSubscribe(event: EventResponse) {

    const connectionId = (event.data as any)?.ConnectionId

    if (connectionId && typeof connectionId === 'string') {

      debug('Received RTA subscribe event', event)

      try {
        this.connectionId = connectionId

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
