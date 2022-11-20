const debug = require('debug')('bedrock-portal');

// Rough alt check, can be improved
const altCheck = async (api, owner) => {
	if (owner.tier === 'Gold') return { isAlt: false, reason: 'Account is subscribed to Xbox Gold' };
	if (owner.gamescore > 1000) return { isAlt: false, reason: `High Gamerscore. Account has ${owner.gamescore}, expected less than 1000` };

	const lastplayed = await api.get(`https://titlehub.xboxlive.com/users/xuid(${owner.xuid})/titles/titlehistory/decoration/detail?maxItems=5000`, { contractVersion: 2 }).then(res => res.titles);

	if (lastplayed.length > 10) return { isAlt: false, reason: `High number of games played. Account has ${lastplayed.length}, expected less than 10` };

	return { isAlt: true, reason: 'Account is likely an alt' };
};

const autoFriendAdd = async (api) => {
	setInterval(async () => {

		const friends = await api.get('https://peoplehub.xboxlive.com/users/me/people/social/decoration/details', { contractVersion: 5 }).then(res => res.people.map(e => e.xuid));
		const followers = await api.get('https://peoplehub.xboxlive.com/users/me/people/followers/decoration/details', { contractVersion: 5 }).then(res => res.people);

		const needsAdding = followers.filter(res => !friends.includes(res.xuid));

		if (!needsAdding.length) return;

		debug(`Adding ${needsAdding.length} account(s) [${needsAdding.map(res => res.gamertag).join(', ')}]`);

		for (const account of needsAdding) {
			await api.put(`https://social.xboxlive.com/users/me/people/xuid(${account.xuid})`, { contractVersion: 2 }).catch(_ => debug(`Couldn't add ${account.xuid}`));
		}

	}, 30000);
};

module.exports = {
	autoFriendAdd,
	altCheck,
};