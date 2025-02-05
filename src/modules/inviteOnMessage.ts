import type { BedrockPortal } from '../index'

import { XboxMessage } from 'xbox-message'

import Module from '../classes/Module'
import MultipleAccounts from './multipleAccounts'
import Host from '../classes/Host'

export default class IniteOnMessage extends Module {

  public options: {
    /**
     * The message to look for in chat to trigger inviting the player
     * @default 'invite'
    */
    command: string,
  }

  public clients: Map<string, XboxMessage>

  constructor(portal: BedrockPortal) {
    super(portal, 'initeOnMessage', 'Automatically invite players to the server when they message you')

    this.options = {
      command: 'invite',
    }

    this.clients = new Map<string, XboxMessage>()

  }

  async run() {

    const xboxMessageHandler = async (host: Host) => {

      const client = new XboxMessage({ authflow: host.authflow })

      this.clients.set(host.authflow.username, client)

      client.on('message', async (message) => {

        this.debug(`Received message from ${message.userId}`)

        const content = message.content

        if (!content) return

        this.portal.emit('messageReceived', message)

        if (content.toLowerCase() === this.options.command.toLowerCase()) {
          await this.portal.invitePlayer(message.userId)
        }
      })

      await client.connect()

    }

    const multipleAccounts = this.portal.modules.get('multipleAccounts')

    if (multipleAccounts && multipleAccounts instanceof MultipleAccounts) {
      for (const account of multipleAccounts.peers.values()) {
        xboxMessageHandler(account)
          .catch(error => this.debug(`Error: ${error.message}`, error))
      }
    }

    xboxMessageHandler(this.portal.host)

  }

  async stop() {
    super.stop()

    for (const client of this.clients.values()) {
      await client.destroy()
    }
  }

}
