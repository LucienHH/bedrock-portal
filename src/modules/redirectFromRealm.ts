import type { BedrockPortal } from '..'

import Module from '../classes/Module'

const cd = new Set()

export default class RedirectFromRealm extends Module {

  public bedrock: any

  public client: any

  public heartbeat: NodeJS.Timeout | null = null

  public options: {
    /**
     * The client options to use when connecting to the Realm. These are passed directly to a [bedrock-protocol createClient](https://github.com/PrismarineJS/bedrock-protocol/blob/master/docs/API.md#becreateclientoptions--client)
     * @type {ClientOptions}
     * @default {}
     */
    clientOptions: any,
    /**
     * The device OS to use when connecting to the Realm. This is passed directly to a [bedrock-protocol createClient](https://github.com/PrismarineJS/bedrock-protocol/blob/master/docs/API.md#becreateclientoptions--client)
     * @default 7 // = Windows
    */
    overideDeviceOS: number,
    /**
     * Options for the chat command
     * @type {object}
     */
    chatCommand: {
      /**
       * Whether sending the command in chat should trigger an invite
       * @default true
      */
      enabled: boolean,
      /**
       * The message to send in chat to run the command
       * @default 'invite'
      */
      cooldown: number,
      /**
       * The cooldown between being able to send the command in chat
       * @default 60000
      */
      message: string,
    },
  }

  constructor() {
    super('redirectFromRealm', 'Automatically invite players to the server when they join a Realm')
    this.options = {
      clientOptions: { }, // Options for the bedrock-protocol client
      overideDeviceOS: 7,
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

  async run(portal: BedrockPortal) {

    const { clientOptions } = this.options

    const client = await this.initClient(clientOptions, portal)
      .catch(error => ({ error }))

    if ('error' in client) return console.error(`Error connecting to Realm - ${client.error.message}. BedrockPortal will continue to run, but will not be able to redirect players from this realm.`)

  }

  async initClient(options: any, portal: BedrockPortal) {
    return new Promise<any>((resolve, reject) => {

      this.client = this.bedrock.createClient(options)

      if (this.options.overideDeviceOS) this.client.session = { deviceOS: this.options.overideDeviceOS }

      this.client.once('error', (e: any) => (this.client = null, reject(e)))

      this.client.once('disconnect', (e: any) => (this.client = null, reject(e)))

      this.client.once('spawn', () => {

        this.heartbeat = setInterval(() => {

          this.debug(`Sending heartbeat to Realm - Status: ${this.client?.status}`)

          if (this.client !== null || this.client.status !== 0) return

          this.client = null

          if (this.heartbeat) clearInterval(this.heartbeat)

          this.debug('Attempting to reconnect to Realm')

          return this.initClient(options, portal).catch(err => {
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

  async stop() {
    super.stop()

    if (this.heartbeat) clearInterval(this.heartbeat)

    if (this.client) {
      this.client.disconnect()
      this.client = null
    }

  }
}
