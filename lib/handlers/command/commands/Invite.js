class Invite {
	constructor(portal) {
		this.portal = portal;
		this.commandName = 'invite';
	}
	async execute(args) {

		const { xuid } = args;

		if (!xuid) return this.portal.getLogger().error('No xuid defined, pass through a xuid using the --xuid flag');

		await this.portal.getSessionHandler().invite(xuid);
		this.portal.getLogger().success(`Invited ${xuid} to the current session`);

	}
}
module.exports = { Invite };