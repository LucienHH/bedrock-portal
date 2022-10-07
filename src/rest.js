const axios = require('axios');

module.exports = class Rest {
	constructor(authflow, options = {}) {
		this.auth = authflow;
		this.options = options;
	}

	async get(url, config = {}) {
		return await this._request('GET', { url, ...config });
	}

	async post(url, config = {}) {
		return await this._request('POST', { url, ...config });
	}

	async put(url, config = {}) {
		return await this._request('PUT', { url, ...config });
	}

	async delete(url, config = {}) {
		return await this._request('DELETE', { url, ...config });
	}

	async _request(method, config) {
		const auth = await this.auth.getXboxToken('http://xboxlive.com');

		const payload = {
			method,
			url: config.url,
			headers: {
				'Authorization': `XBL3.0 x=${auth.userHash};${auth.XSTSToken}`,
				'accept-language': 'en-US',
				...(this.options.headers || {}),
				...(config.headers || {}),
			},
		};

		if (config.contractVersion) payload.headers['x-xbl-contract-version'] = config.contractVersion;
		if (config.params) payload.params = config.params;
		if (config.data) payload.data = config.data;

		return await axios(payload).then(e => e.data);
	}

	async getxboxProfileBatch(xuids) {
		const response = await this.post('https://peoplehub.xboxlive.com/users/me/people/batch/decoration/detail,preferredcolor', { data: { xuids }, contractVersion: 5 }).then(e => e.people).catch(e => []);
		return response;
	}

	async getXboxProfile(input) {
		const settings = 'GameDisplayPicRaw,Gamerscore,Gamertag,AccountTier,XboxOneRep,PreferredColor,RealName,Bio,Location,ModernGamertag,ModernGamertagSuffix,UniqueModernGamertag,RealNameOverride,TenureLevel,Watermarks,IsQuarantined,DisplayedLinkedAccounts';

		let target = '';
		if (input === 'me') {
			target = 'me';
		}
		else if (input.length === 16 && !isNaN(input)) {
			target = `xuid(${input})`;
		}
		else {
			target = `gt(${encodeURIComponent(input)})`;
		}

		const response = await this.get(`https://profile.xboxlive.com/users/${target}/profile/settings`, { params: { settings }, contractVersion: 2 });

		const [avatar, gamerscore, gamertag, tier, reputation, colour, realname, bio, location, modernGamertag, modernGamertagSuffix, uniqueModernGamertag, realnameOverride, tenureLevel, watermarks, isQuarantined, linkedAccounts] = response.profileUsers[0].settings.map(e=> e.value);
		const colourData = await axios.get(colour).then(e => e.data);

		const result = {
			xuid: response.profileUsers[0].id,
			avatar: avatar.replace(/&background=0xababab&mode=Padding&format=png/g, ''),
			gamerscore,
			gamertag,
			tier,
			reputation,
			colour: colourData,
			realname,
			bio,
			location,
			modernGamertag,
			modernGamertagSuffix,
			uniqueModernGamertag,
			realnameOverride,
			tenureLevel,
			watermarks,
			isQuarantined,
			linkedAccounts,
		};

		return result;
	}
};