import debugFn from 'debug'
import { EventResponse } from 'xbox-rta'

import { BedrockPortal } from '..'

import Player from '../classes/Player'

const debug = debugFn('bedrock-portal')

export default async (portal: BedrockPortal, event: EventResponse) => {

  if (!(event.data as any).ncid) return

  portal.emit('rtaEvent', event)

  const session = await portal.getSession()

  portal.emit('sessionUpdated', session)

  debug('Received RTA event, session has been updated', session)

  const sessionMembers = Object.values(session.members).filter(member => member.constants.system.xuid !== portal.host?.profile?.xuid)

  const xuids = sessionMembers.map(e => e.constants.system.xuid)

  const profiles = await portal.host.rest.getProfiles(xuids)
    .catch(() => [])

  const players = sessionMembers.map(sessionMember => {
    const player = profiles.find(p => p.xuid === sessionMember.constants.system.xuid)!
    return new Player(player, sessionMember)
  })

  for (const player of players) {
    const xuid = 'xuid' in player.profile ? player.profile.xuid : undefined

    if (!xuid) continue

    if (!portal.players.has(xuid)) { portal.emit('playerJoin', player) }
  }

  for (const [xuid, player] of portal.players) {
    if (!players.find(p => p.profile.xuid === xuid)) { portal.emit('playerLeave', player) }
  }

  portal.players = new Map(players.map(p => [p.profile.xuid!, p]))

}