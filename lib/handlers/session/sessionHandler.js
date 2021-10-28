const uuid = require('uuid');
const { inspect } = require('util');
class sessionHandler {
	constructor(portal) {
		this.portal = portal;
	}

	async onStart() {
		//
	}

	async onEnd() {
		//
	}

	async abandonSession() {
		const api = this.portal.getApiHandler();
		const logger = this.portal.getLogger();

		const abandonSessionUrl = `https://sessiondirectory.xboxlive.com/serviceconfigs/4fc10100-5f7a-4470-899b-280835760c07/sessionTemplates/MinecraftLobby/sessions/${this.sessionId}`;
		const abandonSession = await api
			.put(abandonSessionUrl, { members: { me: null } }, null, 107)
			.then((res) => res.data)
			.catch((err) => logger.error(err.message));

		logger.info('Session abandoned');

		if (!abandonSession) return;
	}

	async invite(xuid) {
		const api = this.portal.getApiHandler();
		const logger = this.portal.getLogger();

		const invitePayload = {
			type: 'invite',
			sessionRef: {
				scid: '4fc10100-5f7a-4470-899b-280835760c07',
				templateName: 'MinecraftLobby',
				name: this.sessionId,
			},
			version: 1,
			invitedXuid: `${xuid}`,
			inviteAttributes: { titleId: '896928775' },
		};

		const sessionInviteUrl = 'https://sessiondirectory.xboxlive.com/handles';
		const sessionInvite = await api
			.post(sessionInviteUrl, invitePayload, null, 107)
			.then((res) => res.data)
			.catch((err) => logger.error(err.message));

		if (!sessionInvite) return;

		logger.info('Session invite sent');
	}

	async publishSession(host = { ip: 'geyserconnect.net', port: 19132 }, world) {
		this.sessionId = uuid.v4();

		const api = this.portal.getApiHandler();
		const logger = this.portal.getLogger();

		const auth = await this.portal.getAuthHandler().getXboxToken();

		const connectionId = await this.portal
			.getWebsocketHandler()
			.getConnectionId();

		const sessionBody = this._createSessionBody(auth.userXUID, connectionId, host, world);
		const propertiesBody = this._createPropertiesBody(auth.userXUID, connectionId, host, world);

		console.log(inspect(sessionBody, false, null, true));

		const createSessionUrl = `https://sessiondirectory.xboxlive.com/serviceconfigs/4fc10100-5f7a-4470-899b-280835760c07/sessionTemplates/MinecraftLobby/sessions/${this.sessionId}`;
		const createSession = await api.put(createSessionUrl, sessionBody, null, 107)
			.then((res) => res.data)
			.catch((err) => logger.error(err.message));

		if (!createSession) return;

		logger.info(`Created session, name: ${this.sessionId}`);

		const publishSessionUrl = 'https://sessiondirectory.xboxlive.com/handles';
		const publishSession = await api.post(publishSessionUrl, { version: 1, type: 'activity', sessionRef: { scid: '4fc10100-5f7a-4470-899b-280835760c07', templateName: 'MinecraftLobby', name: this.sessionId } }, null, 107)
			.then((res) => res.data)
			.catch((err) => logger.error(err.message));

		if (!publishSession) return;

		const addPropertiesUrl = `https://sessiondirectory.xboxlive.com/serviceconfigs/4fc10100-5f7a-4470-899b-280835760c07/sessionTemplates/MinecraftLobby/sessions/${this.sessionId}`;
		const addProperties = await api.put(addPropertiesUrl, propertiesBody, null, 107)
			.then((res) => res.data)
			.catch((err) => logger.error(err.message));

		if (!addProperties) return;

		logger.info('Published session');
	}

	_createPropertiesBody(ownerXuid, connectionId, host, world = {}) {
		return {
			properties: {
				custom: {
					Joinability: 'joinable_by_friends',
					hostName: world.hostName || 'HostName',
					ownerId: ownerXuid,
					rakNetGUID: '12996504943305946298',
					version: world.version || 'Version',
					levelId: 'mgNjYX39AQA=',
					worldName: world.worldName || 'WorldName',
					worldType: 'Survival',
					protocol: 465,
					MemberCount: world.memberCount || 1,
					MaxMemberCount: world.maxMemberCount || 10,
					BroadcastSetting: 3,
					LanGame: true,
					UsesWebSocketsWebRTCSignaling: false,
					UsesMPSDWebRTCSignaling: false,
					netherNetEnabled: false,
					OnlineCrossPlatformGame: true,
					CrossPlayDisabled: false,
					TitleId: 0,
					SupportedConnections: [
						{
							ConnectionType: 6,
							HostIpAddress: host.ip,
							HostPort: parseInt(host.port),
							RakNetGUID: '',
						},
					],
				},
			},
		};
	}

	_createSessionBody(ownerXuid, connectionId, host, world = {}) {
		return {
			properties: {
				system: {
					joinRestriction: 'followed',
					readRestriction: 'followed',
					closed: false,
				},
				custom: {
					Joinability: 'joinable_by_friends',
					hostName: world.hostName || 'HostName',
					ownerId: ownerXuid,
					rakNetGUID: '12996504943305946298',
					version: world.version || 'Version',
					// 'levelId': 'TT5iYfXVAAA=',
					worldName: world.worldName || 'WorldName',
					'worldType': 'Survival',
					protocol: 465,
					MemberCount: world.memberCount || 0,
					MaxMemberCount: world.maxMemberCount || 10,
					BroadcastSetting: 3,
					UsesWebSocketsWebRTCSignaling: false,
					UsesMPSDWebRTCSignaling: false,
					netherNetEnabled: false,
					OnlineCrossPlatformGame: true,
					CrossPlayDisabled: false,
					TitleId: 0,
					SupportedConnections: [
						{
							ConnectionType: 6,
							HostIpAddress: host.ip,
							HostPort: parseInt(host.port),
							RakNetGUID: '',
						},
					],
				},
			},
			members: {
				me: {
					constants: {
						system: {
							xuid: ownerXuid,
							initialize: true,
						},
					},
					properties: {
						system: {
							active: true,
							connection: connectionId,
							subscription: {
								id: '69C0C646-DDAC-4F78-8232-2A65B8A3BDB4',
								changeTypes: ['everything'],
							},
						},
					},
				},
			},
		};
	}
}

module.exports = {
	sessionHandler,
};
