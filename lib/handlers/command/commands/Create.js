class Create {
	constructor(portal) {
		this.portal = portal;
		this.commandName = 'create';
	}
	async execute(args) {

		const { ip, port } = args;

		if (!ip || !port) return this.portal.getLogger().error('No host defined, pass through both the --ip and --port flags');

		this.portal.getLogger().info('Creating portal');
		await this.portal.getSessionHandler().publishSession({ ip, port });
		this.portal.getLogger().success(`Portal created, relaying clients to ${ip}:${port}`);

	}
}
module.exports = { Create };