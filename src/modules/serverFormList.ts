import { BedrockPortal } from '..'

import Module from '../classes/Module'

import { start_game } from '../common/start_game'

type FormResponsePacket = {
  form_id: number,
  has_response_data: boolean,
  data: string,
  has_cancel_reason: boolean,
  cancel_reason?: string
}

export default class ServerFromList extends Module {

  private n: number

  constructor() {
    super('serverFromList', 'Allows players to join the server from a list of servers')
    this.options = {
      form: {
        title: '§l§aServer Form List',
        content: '§7Please select a server to join',
        buttons: [
          { text: '§8Anarchy Server\n§7Click Here§!', ip: 'bedrock.opblocks.com', port: 19132 },
          { text: '§7Creative Server\n§7Click Here§', ip: 'bedrock.opblocks.com', port: 19132 },
          { text: '§6Survival Server\n§7Click Here§!', ip: 'bedrock.opblocks.com', port: 19132 },
        ],
      },
      timeout: 60000,
      timeoutMessage: '§cYou took too long to respond',
    }

    this.n = 0

  }

  async run(portal: BedrockPortal) {

    portal.onServerConnection = (client) => {

      client.once('join', () => this.handleJoin(client))

      client.on('spawn', () => {
        this.sendForm(client)
      })

      setTimeout(() => {
        client.disconnect(this.options.timeoutMessage)
      }, this.options.timeout)

    }

  }

  private sendForm(client: any) {
    client.write('modal_form_request', {
      form_id: this.n++,
      data: JSON.stringify({
        type:'form',
        title: this.options.form.title,
        content: this.options.form.content,
        buttons: this.options.form.buttons.map((button: any) => ({ text: button.text })),
      }),
    })
  }

  private handleJoin(client: any) {
    client.write('resource_packs_info', { must_accept: false, has_addons: false, has_scripts: false, texture_packs: [], resource_pack_links: [] })

    client.write('resource_pack_stack', { must_accept: false, behavior_packs: [], resource_packs: [], game_version: '', experiments: [], experiments_previously_used: false })

    client.once('resource_pack_client_response', async () => {
      client.write('start_game', start_game)

      client.write('play_status', { status: 'player_spawn' })
    })

    client.on('modal_form_response', (p: FormResponsePacket) => this.handleFormResponse(p, client))
  }

  private handleFormResponse(response: FormResponsePacket, client: any) {

    if(response.has_cancel_reason) {
      setInterval(() => this.sendForm(client), 5000)
      return
    }

    const server = this.options.form.buttons[parseInt(response.data)]

    client.write('transfer', { server_address: server.ip, port: server.port })

  }

}
