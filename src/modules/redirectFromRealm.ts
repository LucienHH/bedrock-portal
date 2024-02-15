import type { XboxRTA } from 'xbox-rta'

import type Rest from '../rest'
import type { BedrockPortal } from '..'

import Module from '../classes/Module'

const cd = new Set()

export default class RedirectFromRealm extends Module {

  public bedrock: any

  public client: any

  public heartbeat: NodeJS.Timeout | null = null

  constructor() {
    super('redirectFromRealm', 'Automatically invite players to the server when they join a Realm')
    this.options = {
      clientOptions: { }, // Options for the bedrock-protocol client
      chatCommand: {
        enabled: true,
        cooldown: 60000,
        message: 'invite',
      },
    }
    try {
      this.bedrock = require('bedrock-protocol')
    }
    catch (e) {
      console.trace('bedrock-protocol is not installed, please run "npm i bedrock-protocol" to use this module')
      process.exit(1)
    }
  }

  async run(portal: BedrockPortal, _rest: Rest, _rta: XboxRTA) {

    const { clientOptions } = this.options

    const client = await this.initClient(clientOptions, portal)
      .catch(error => ({ error }))

    if ('error' in client) return console.error(`Error connecting to Realm - ${client.error.message}. BedrockPortal will continue to run, but will not be able to redirect players from this realm.`)

  }

  async initClient(options: any, portal: BedrockPortal) {
    return new Promise<any>((resolve, reject) => {

      this.client = this.bedrock.createClient(options)

      this.client.once('error', (e: any) => (this.client = null, reject(e)))

      this.client.once('disconnect', (e: any) => (this.client = null, reject(e)))

      this.client.once('spawn', () => {

        this.heartbeat = setInterval(async () => {

          this.debug(`Sending heartbeat to Realm - Status: ${this.client?.status}`)

          if (this.client !== null || this.client.status !== 0) return

          this.client = null

          if (this.heartbeat) clearInterval(this.heartbeat)

          this.debug('Attempting to reconnect to Realm')

          return await this.initClient(options, portal).catch(err => {
            this.debug(`Error reconnecting to Realm - ${err.message}`)
          })

        }, 30000)

        resolve(this.client)
      })

      this.client.on('player_list', (packet: any) => {
        if (packet.records.type !== 'add') return

        for (const record of packet.records.records) {
          portal.invitePlayer(record.xbox_user_id)
            .catch(e => this.debug(`Failed to invite ${record.xbox_user_id} - ${e.message}`))
        }
      })

      this.client.on('text', (packet: any) => {
        if (!this.options.chatCommand.enabled || packet.type !== 'chat' || cd.has(packet.xuid)) return

        if (packet.message.toLowerCase()! !== this.options.chatCommand.message.toLowerCase()) return

        cd.add(packet.xuid)

        setTimeout(() => cd.delete(packet.xuid), this.options.chatCommand.cooldown)

        portal.invitePlayer(packet.xuid)
          .catch(e => this.debug(`Failed to invite ${packet.xuid} - ${e.message}`))
      })

    })
  }
}
