import debugFn from 'debug'

import { SubscribeResponse } from 'xbox-rta'

import { BedrockPortal } from '..'

const debug = debugFn('bedrock-portal')

export default async (portal: BedrockPortal, event: SubscribeResponse) => {

  const connectionId = (event.data as any).data.ConnectionId

  if (connectionId && typeof connectionId === 'string') {
    try {
      await portal.rest.updateConnection(portal.session.name, connectionId)
      await portal.rest.setActivity(portal.session.name)
    }
    catch (e) {
      debug('Failed to update connection, session may have been abandoned', e)
      await portal.end(true)
    }
  }

}