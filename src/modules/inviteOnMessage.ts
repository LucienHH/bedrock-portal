import type { XboxRTA } from 'xbox-rta'

import type Rest from '../rest'
import type { BedrockPortal } from '../index'
import type { Conversation } from '../types/xblmessaging'

import Module from '../classes/Module'

export default class IniteOnMessage extends Module {

  public cache: Conversation[]

  constructor() {
    super('initeOnMessage', 'Automatically invite players to the server when they message you')

    this.options = {
      command: 'invite',
      checkInterval: 30000,
    }

    this.cache = []
  }

  async run(portal: BedrockPortal, rest: Rest, _rta: XboxRTA) {

    const initeOnMessage = async () => {
      const primaryMessages = await rest.getInboxMessages('primary')
      const secondaryMessages = await rest.getInboxMessages('secondary')

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
        portal.emit('messageRecieved', message.lastMessage)

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

    const messageInterval = setInterval(() => {
      if (this.stopped) {
        clearInterval(messageInterval)
        return
      }
      initeOnMessage()
        .catch(error => this.debug(`Error: ${error.message}`, error))
    }, this.options.checkInterval)

  }
}
