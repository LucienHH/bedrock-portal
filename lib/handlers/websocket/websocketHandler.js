const WebSocket = require('ws');
const { setTimeout } = require('timers/promises');
let connectionId;
class websocketHandler {
	constructor(portal) {
		this.portal = portal;
	}

	async onStart() {

		const logger = this.portal.getLogger();

		await this.connectWebsocket();

		this.portal.websocket.once('open', () => logger.info('Websocket connected'));

		this.portal.websocket.on('open', this.heartbeat);
		this.portal.websocket.on('ping', this.heartbeat);
		this.portal.websocket.on('close', () => {
			clearTimeout(this.pingTimeout);
		});

		this.portal.websocket.on('message', function incoming(message) {
			const msg = message.toString();

			const res = JSON.parse(msg);

			if (msg.includes('ConnectionId')) connectionId = res[4].ConnectionId;
			else logger.websocket(res[2].shoulderTaps);
		});

	}


	async onEnd() {
		//
	}

	heartbeat(data) {
		clearTimeout(this.pingTimeout);

		this.pingTimeout = setTimeout(() => {
			this.portal.websocket.terminate();
		}, 30000 + 1000);
	}

	async getConnectionId() {
		await this._requestConnectionId();
		await setTimeout(2000);
		return connectionId;
	}

	async connectWebsocket() {
		const auth = await this.portal.getAuthHandler().getXboxToken();
		const xblToken = `XBL3.0 x=${auth.userHash};${auth.XSTSToken}`;

		this.portal.websocket = new WebSocket('wss://rta.xboxlive.com/connect', { headers: { 'Authorization': xblToken } });
	}

	async closeWebsocket() {
		this.portal.getLogger().info('Terminating websocket connection');
		this.portal.websocket.terminate();
	}

	async _requestConnectionId() {
		this.portal.websocket.send('[1,1,"https://sessiondirectory.xboxlive.com/connections/"]');
	}
}

module.exports = {
	websocketHandler,
};