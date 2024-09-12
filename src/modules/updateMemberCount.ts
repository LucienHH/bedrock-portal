import { BedrockPortal } from '..'

import Module from '../classes/Module'

export default class UpdateMemberCount extends Module {

  public ping: any

  constructor() {
    super('updateMemberCount', 'Periodically updates the member count of the session to the amount of players online')
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

  async run(portal: BedrockPortal) {

    let cycle = 0

    setInterval(async () => {
      try {
        const data = await this.ping({ host: portal.options.ip, port: portal.options.port })

        this.debug(`Updating member count to ${data.playersOnline} / ${data.playersMax}`)

        await portal.updateMemberCount(data.playersOnline, this.options.updateMaxMemberCount ? data.playersMax : undefined)

        portal.emit('memberCountUpdate', { online: Number(data.playersOnline), max: Number(data.playersMax), cycle })
      }
      catch (error: any) {
        this.debug(`Error updating member count - ${error.message}`, error)
      }
      cycle++
    }, this.options.updateInterval)

  }
}
