const altCheck = async (rest) => {
  const owner = await rest.getXboxProfile('me');

  if (owner.tier === 'Gold') return { isAlt: false, reason: 'Account is subscribed to Xbox Gold' };
  if (owner.gamescore > 1000) return { isAlt: false, reason: `High Gamerscore. Account has ${owner.gamescore}, expected less than 1000` };

  const lastplayed = await rest.getXboxTitleHistory(owner.xuid);

  if (lastplayed.length > 10) return { isAlt: false, reason: `High number of games played. Account has ${lastplayed.length}, expected less than 10` };

  return { isAlt: true, reason: 'Account is likely an alt' };
};

module.exports = {
  altCheck,
};
