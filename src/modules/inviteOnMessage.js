/* eslint-disable no-constant-condition */
const Module = require('../classes/Module.js');

class IniteOnMessage extends Module {
  constructor() {
    super('initeOnMessage', 'Automatically invite players to the server when they message you');
    this.options = {
      command: 'invite',
      checkInterval: 30000,
    };
    this.cache = [];
  }

  async run(portal, { rest, rta }) {

    const initeOnMessage = async () => {
      const primaryMessages = await rest.get('https://xblmessaging.xboxlive.com/network/xbox/users/me/inbox/primary', { contractVersion: 1 });
      const secondaryMessages = await rest.get('https://xblmessaging.xboxlive.com/network/xbox/users/me/inbox/secondary', { contractVersion: 1 });

      const messages = [...primaryMessages.conversations, ...secondaryMessages.conversations];

      const contentMessages = messages.filter(message => message.lastMessage.type === 'ContentMessage');

      this.debug(`Found ${contentMessages.length} content message(s)`);

      if (this.cache.length === 0) return this.cache = contentMessages;

      // use #.lastMessage.messageId
      const newMessages = contentMessages.filter(message => this.cache.some(cacheMessage => cacheMessage.lastMessage.messageId !== message.lastMessage.messageId && cacheMessage.conversationId === message.conversationId));

      this.debug(`Found ${newMessages.length} new message(s)`);

      if (newMessages.length === 0) return;

      for (const message of newMessages) {
        portal.emit('messageRecieved', message.lastMessage);

        const senderXuid = message.lastMessage.sender;

        if (senderXuid === '0') continue;

        this.debug(`Received message from ${senderXuid}`);

        const content = message.lastMessage.contentPayload.content.parts.find(part => part.contentType === 'text')?.text;

        if (!content) continue;

        if (content.toLowerCase() === this.options.command.toLowerCase()) {
          await portal.invitePlayer(senderXuid);
        }
      }

      this.cache = contentMessages;
    };

    while (!this.stopped) {
      try {
        await initeOnMessage();
        await new Promise(resolve => setTimeout(resolve, this.options.checkInterval));
      }
      catch (error) {
        this.debug(`Error: ${error.message}`, error);
      }
    }
  }
}

module.exports = IniteOnMessage;
