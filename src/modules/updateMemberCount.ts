import { BedrockPortal } from '..'

import Module from '../classes/Module'

export default class UpdateMemberCount extends Module {

  public ping: any

  public options: {
    /**
      * How often to update the member count
      * @default 60000
    */
    updateInterval: number,
    /**
      * Whether to update the max member count
      * @default true
    */
    updateMaxMemberCount: boolean,
  }

  constructor(portal: BedrockPortal) {
    super(portal, 'updateMemberCount', 'Periodically updates the member count of the session to the amount of players online')
    this.options = {
      updateInterval: 60000,
      updateMaxMemberCount: true,
    }

    try {
      this.ping = require('bedrock-protocol').ping
    }
    catch (e) {
      console.trace('bedrock-protocol is not installed, please run "npm i bedrock-protocol" to use this module')
      process.exit(1)
    }
  }

  async run() {

    let cycle = 0

    setInterval(async () => {
      try {
        const data = await this.ping({ host: this.portal.options.ip, port: this.portal.options.port })

        this.debug(`Updating member count to ${data.playersOnline} / ${data.playersMax}`)

        await this.portal.updateMemberCount(data.playersOnline, this.options.updateMaxMemberCount ? data.playersMax : undefined)

        this.portal.emit('memberCountUpdate', { online: Number(data.playersOnline), max: Number(data.playersMax), cycle })
      }
      catch (error: any) {
        this.debug(`Error updating member count - ${error.message}`, error)
      }
      cycle++
    }, this.options.updateInterval)

  }
}
