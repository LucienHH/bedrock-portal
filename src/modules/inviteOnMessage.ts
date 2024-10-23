import type { BedrockPortal } from '../index'

import Module from '../classes/Module'
import { XboxMessage } from 'xbox-message'

export default class IniteOnMessage extends Module {

  public options: {
    /**
     * The message to look for in chat to trigger inviting the player
     * @default 'invite'
    */
    command: string,
  }

  public client: XboxMessage

  constructor(portal: BedrockPortal) {
    super(portal, 'initeOnMessage', 'Automatically invite players to the server when they message you')

    this.options = {
      command: 'invite',
    }

    this.client = new XboxMessage({ authflow: portal.authflow })

  }

  async run() {

    this.client.on('message', async (message) => {

      this.debug(`Received message from ${message.userId}`)

      const content = message.content

      if (!content) return

      this.portal.emit('messageReceived', message)

      if (content.toLowerCase() === this.options.command.toLowerCase()) {
        await this.portal.invitePlayer(message.userId)
      }
    })

    await this.client.connect()

  }

  async stop() {
    super.stop()

    this.client.destroy()
  }

}
