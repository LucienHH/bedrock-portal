class Help {
	constructor(portal) {
		this.portal = portal;
		this.commandName = 'help';
	}
	async execute(args) {
		this.portal.getLogger().info('Bedrock Portal by Lucienn. Here is a list of commands:');
		for (const command of this.portal.getCommandHandler().getCommandNames()) {
			this.portal.getLogger().info(`-> portal ${command}`);
		}
	}
}
module.exports = { Help };