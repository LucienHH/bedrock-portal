class Close {
	constructor(portal) {
		this.portal = portal;
		this.commandName = 'close';
	}
	async execute(args) {

		this.portal.getLogger().info('Closing portal');
		await this.portal.getSessionHandler().abandonSession();
		// await this.portal.getWebsocketHandler().closeWebsocket();
		this.portal.getLogger().success('Portal closed successfully');

	}
}
module.exports = { Close };