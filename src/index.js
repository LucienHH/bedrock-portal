const debug = require('debug')('bedrock-portal');
const { v4: uuidV4 } = require('uuid');
const { XboxRTA } = require('xbox-rta');
const { EventEmitter } = require('events');

const { altCheck } = require('./common/util');
const { SessionConfig, Endpoints, Joinability } = require('./common/constants');

const Rest = require('./rest');

const genRaknetGUID = () => {
  const chars = '0123456789';
  let result = '';
  for (let i = 20; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
  return result;
};

module.exports = class BedrockPortal extends EventEmitter {
  #rest;#rta;
  constructor(authflow, options = {}) {
    super();
    const name = options.sessionName || uuidV4();
    this.validateOptions(options);
    this.#rest = new Rest(authflow);
    this.#rta = new XboxRTA(authflow);
    this.options = options;
    this.session = {
      url: `https://sessiondirectory.xboxlive.com/serviceconfigs/${SessionConfig.MinecraftSCID}/sessionTemplates/${SessionConfig.MinecraftTemplateName}/sessions/${name}`,
      name,
      subscriptionId: uuidV4(),
    };
    this.players = [];
  }

  validateOptions(options) {
    if (!options.ip) throw new Error('No IP provided');
    if (!options.port) throw new Error('No port provided');
    if (options.joinability && !Object.keys(Joinability).includes(options.joinability)) throw new Error('Invalid joinability - Expected one of ' + Object.keys(Joinability).join(', '));
  }

  async start() {
    this.sessionOwner = await this.#rest.getXboxProfile('me');

    if (!this.options.disableAltCheck) {
      const { isAlt, reason } = await altCheck(this.#rest, this.sessionOwner);
      if (!isAlt) throw new Error('Genuine account detected - ' + reason);
    }

    await this.#rta.connect();

    const connectionId = await this.#rta.subscribe('https://sessiondirectory.xboxlive.com/connections/').then(e => e.data.ConnectionId);

    const session = await this.createAndPublishSession(connectionId);

    await this.#handleSessionEvents();

    return session;
  }

  async createAndPublishSession(connectionId) {
    this.players = [];

    await this.updateSession(this.#createSessionBody(connectionId));

    debug(`Created session, name: ${this.session.name}`);

    await this.updateHandle(this.#createHandleBody('activity'));

    const session = await this.getSession();

    await this.updateSession({ properties: session.properties });

    debug(`Published session, name: ${this.session.name}`);

    return session;
  }

  async end() {
    await this.#rta.disconnect();

    await this.updateSession({ members: { me: null } });

    if (this.modules) {
      for (const mod of Object.values(this.modules)) {
        mod.stop();
      }
    }
    debug(`Abandoned session, name: ${this.session.name}`);
  }

  getSessionMembers() {
    return this.players;
  }

  async invitePlayer(identifier) {
    const profile = await this.#rest.getXboxProfile(identifier);
    const invitePayload = {
      invitedXuid: String(profile.xuid),
      inviteAttributes: { titleId: SessionConfig.MinecraftTitleID },
    };

    await this.updateHandle(this.#createHandleBody('invite', invitePayload));

    debug(`Invited player, xuid: ${profile.xuid}`);

  }

  async updateMemberCount(count) {
    await this.updateSession({ properties: { custom: { MemberCount: Number(count) } } });
  }

  async updateConnection(connectionId) {
    await this.updateSession({
      members: {
        me: {
          properties: {
            system: {
              active: true,
              connection: connectionId,
            },
          },
        },
      },
    });
  }

  async getSession() {
    return await this.#rest.get(this.session.url, {
      contractVersion: 107,
    });
  }

  async updateSession(payload) {
    await this.#rest.put(this.session.url, {
      data: { ...payload },
      contractVersion: 107,
    });
  }

  async updateHandle(payload) {
    await this.#rest.post(Endpoints.Handle, {
      data: { ...payload },
      contractVersion: 107,
    });
  }

  use(module, options = {}) {

    debug(`Enabled module: ${module.name} with options: ${JSON.stringify(options)}`);

    this.modules = this.modules || {};

    if (typeof module === 'function') module = new module();
    if (!(module instanceof require('./classes/Module'))) throw new Error('Module must extend the base module');
    if (typeof module.run !== 'function') throw new Error('Module must have a run function');
    if (this.modules[module.name]) throw new Error(`Module with name ${module.name} has already been loaded`);

    module.applyOptions(options);

    this.modules[module.name] = module;
  }

  async #handleSessionEvents() {
    this.#rta.on('reconnect', async () => {
      const connectionId = await this.#rta.subscribe('https://sessiondirectory.xboxlive.com/connections/').then(e => e.data.ConnectionId);

      try {
        await this.updateConnection(connectionId);
        await this.updateHandle(this.#createHandleBody('activity'));
      }
      catch (e) {
        debug('Failed to update connection, session may have been abandoned', e);
        await this.createAndPublishSession(connectionId);
      }
    });

    this.#rta.on('event', async ({ type, subId, data }) => {
      this.emit('rtaEvent', { type, subId, data });
      const session = await this.getSession();

      debug('Received RTA event, session has been updated', session);

      const sessionMembers = Object.keys(session.members).map(key => session.members[key]).filter(member => member.constants.system.xuid !== this.sessionOwner.xuid);
      const xuids = sessionMembers.map(e => e.constants.system.xuid);

      const profiles = await this.#rest.getxboxProfileBatch(xuids);

      const players = sessionMembers.map(e => {
        const { xuid, gamertag, displayPicRaw: avatar, gamerScore: gamerscore, preferredColor: colour } = profiles.find(p => p.xuid === e.constants.system.xuid);
        return {
          profile: { xuid, gamertag, avatar, gamerscore, colour },
          session: {
            titleId: e.activeTitleId,
            joinTime: e.joinTime,
            index: e.constants.system.index,
            connectionId: e.properties.system.connection,
            subscriptionId: e.properties.system.subscription?.id,
          },
        };
      });

      const newPlayers = players.filter(player => !this.players.find(p => p.profile.xuid === player.profile.xuid));
      if (newPlayers.length) this.emit('playersAdded', newPlayers);

      const removedPlayers = this.players.filter(player => !players.find(p => p.profile.xuid === player.profile.xuid));
      if (removedPlayers.length) this.emit('playersRemoved', removedPlayers);

      this.players = players;
    });

    if (this.modules) {
      for (const mod of Object.values(this.modules)) {
        mod.run(this, { rest: this.#rest, rta: this.#rta })
          .then(() => debug(`Module ${mod.name} has run`))
          .catch(e => debug(`Module ${mod.name} failed to run`, e));
      }
    }

  }

  #createHandleBody(type, additional = {}) {
    return {
      version: 1,
      type,
      sessionRef: {
        scid: SessionConfig.MinecraftSCID,
        templateName: SessionConfig.MinecraftTemplateName,
        name: this.session.name,
      },
      ...additional,
    };
  }

  #createSessionBody(connectionId) {
    const joinability = Joinability[this.options.joinability ?? 'friends_of_friends'];
    return {
      properties: {
        system: {
          joinRestriction: joinability.joinRestriction,
          readRestriction: 'followed',
          closed: false,
        },
        custom: {
          hostName: String(this.options.world?.hostName || `${this.sessionOwner.gamertag}'s Portal`),
          worldName: String(this.options.world?.name || 'BedrockPortal'),
          version: String(this.options.world?.version || require('../package.json').version),
          MemberCount: Number(this.options.world?.memberCount ?? 0),
          MaxMemberCount: Number(this.options.world?.maxMemberCount ?? 10),
          Joinability: joinability.joinability,
          ownerId: this.sessionOwner.xuid,
          rakNetGUID: genRaknetGUID(),
          worldType: 'Survival',
          protocol: SessionConfig.MiencraftProtocolVersion,
          BroadcastSetting: joinability.broadcastSetting,
          OnlineCrossPlatformGame: true,
          CrossPlayDisabled: false,
          TitleId: 0,
          TransportLayer: 0,
          SupportedConnections: [
            {
              ConnectionType: 6,
              HostIpAddress: this.options.ip,
              HostPort: Number(this.options.port),
              RakNetGUID: '',
            },
          ],
        },
      },
      members: {
        me: {
          constants: {
            system: {
              xuid: this.sessionOwner.xuid,
              initialize: true,
            },
          },
          properties: {
            system: {
              active: true,
              connection: connectionId,
              subscription: {
                id: this.session.subscriptionId,
                changeTypes: ['everything'],
              },
            },
          },
        },
      },
    };
  }
};