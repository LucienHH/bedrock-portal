class friendHandler {
	constructor(portal) {
		this.portal = portal;
	}

	async onStart() {

		const api = this.portal.getApiHandler();
		const logger = this.portal.getLogger();

		setInterval(async () => {

			const friends = await api.get('https://peoplehub.xboxlive.com/users/me/people/social/decoration/details').then(res => res.data.people.map(e => e.xuid));
			const followers = await api.get('https://peoplehub.xboxlive.com/users/me/people/followers/decoration/details').then(res => res.data.people);

			const needsAdding = followers.filter(res => !friends.includes(res.xuid));

			if (!needsAdding.length) return;

			logger.info(`Adding ${needsAdding.length} account(s) [${needsAdding.map(res => res.gamertag).join(', ')}]`);

			for (let i = 0; i < needsAdding.length; i++) {
				const account = needsAdding[i];

				await api.put(`https://social.xboxlive.com/users/me/people/xuid(${account.xuid})`, null, null, 2).catch(err => logger.error(`Couldn't add ${account.xuid}`));
			}

		}, 30000);

	}

	async onEnd() {
		//
	}

}

module.exports = {
	friendHandler,
};