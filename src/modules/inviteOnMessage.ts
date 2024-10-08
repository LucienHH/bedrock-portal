import type { BedrockPortal } from '../index'
import type { Conversation } from '../types/xblmessaging'

import Module from '../classes/Module'

export default class IniteOnMessage extends Module {

  public interval: NodeJS.Timeout | null = null

  public cache: Conversation[]

  public options: {
    /**
     * The message to look for in chat to trigger inviting the player
     * @default 'invite'
    */
    command: string,
    /**
     * How often to check for new messages in milliseconds
     * @default 30000
    */
    checkInterval: number,
  }

  constructor() {
    super('initeOnMessage', 'Automatically invite players to the server when they message you')

    this.options = {
      command: 'invite',
      checkInterval: 30000,
    }

    this.cache = []
  }

  async run(portal: BedrockPortal) {

    const initeOnMessage = async () => {
      const primaryMessages = await portal.host.rest.getInboxMessages('primary')
      const secondaryMessages = await portal.host.rest.getInboxMessages('secondary')

      const messages = [...primaryMessages.conversations, ...secondaryMessages.conversations]

      const contentMessages = messages.filter(message => message.lastMessage.type === 'ContentMessage')

      this.debug(`Found ${contentMessages.length} content message(s)`)

      if (this.cache.length === 0) {
        this.cache = contentMessages
        return
      }

      // use #.lastMessage.messageId
      const newMessages = contentMessages.filter(message => this.cache.some(cacheMessage => cacheMessage.lastMessage.messageId !== message.lastMessage.messageId && cacheMessage.conversationId === message.conversationId))

      this.debug(`Found ${newMessages.length} new message(s)`)

      if (newMessages.length === 0) return

      for (const message of newMessages) {

        if (portal.listenerCount('messageRecieved') > 0) {
          console.warn('[Deprecation Warning]: The event \'messageRecieved\' is deprecated and will be removed in a future release. Please use \'messageReceived\' instead.')
          portal.emit('messageRecieved', message.lastMessage)
        }

        portal.emit('messageReceived', message.lastMessage)

        const senderXuid = message.lastMessage.sender

        if (senderXuid === '0') continue

        this.debug(`Received message from ${senderXuid}`)

        const content = message.lastMessage.contentPayload.content.parts.find(part => part.contentType === 'text')?.text

        if (!content) continue

        if (content.toLowerCase() === this.options.command.toLowerCase()) {
          await portal.invitePlayer(senderXuid)
        }
      }

      this.cache = contentMessages
    }

    this.interval = setInterval(() => {
      initeOnMessage()
        .catch(error => this.debug(`Error: ${error.message}`, error))
    }, this.options.checkInterval)

  }

  async stop() {
    super.stop()
    if (this.interval) {
      clearInterval(this.interval)
    }
  }

}
