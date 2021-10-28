const axios = require('axios');

class apiHandler {
	constructor(portal) {
		this.portal = portal;
	}

	async onStart() {
		//
	}

	async onEnd() {
		//
	}

	async post(url, data, params, version) {
		return await this.request({ method: 'POST', url, params, version, data });
	}

	async put(url, data, params, version) {
		return await this.request({ method: 'PUT', url, params, version, data });
	}

	async get(url, params, version) {
		return await this.request({ method: 'GET', url, params, version, data: null });
	}

	async request(options) {
		const authInfo = await this.portal.getAuthHandler().getXboxToken();
		return await axios({
			method: options.method,
			url: options.url,
			headers: { 'x-xbl-contract-version': options.version || 2, Authorization: `XBL3.0 x=${authInfo.userHash};${authInfo.XSTSToken}`, 'Content-Type': 'application/json', Accept: 'application/json', 'Accept-Language': 'en-GB' },
			params: options.params,
			data: options.data,
		});
	}
}

module.exports = {
	apiHandler,
};