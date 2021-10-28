const { Authflow } = require('prismarine-auth');
const fs = require('fs').promises;
class authHandler {
	constructor(portal) {
		this.portal = portal;
	}

	async onStart() {
		await this.getXboxToken();
	}

	async onEnd() {
		//
	}

	async refreshXboxToken() {
		await fs.unlink('./cache/da39a3_xbl-cache.json');
		return await this.getXboxToken();
	}

	async getXboxToken() {
		const flow = new Authflow('portal', './cache', { relyingParty: 'http://xboxlive.com', authTitle: '00000000441cc96b' });
		return await flow.getXboxToken();
	}
}

module.exports = {
	authHandler,
};