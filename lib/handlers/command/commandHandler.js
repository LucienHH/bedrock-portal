const readline = require('readline');
const parseArgs = require('minimist');
const fs = require('fs').promises;

class commandHandler {
	constructor(portal) {
		this.portal = portal;
		this.commands = new Map();
	}

	async onStart() {
		await this.loadDefaultCommands();
		this.readline = readline.createInterface({
			input: process.stdin,
			output: process.stdout,
			terminal: false,
		});

		this.readline.on('line', line => {
			const prefix = line.split(' ')[0];
			const cmdName = line.toLowerCase().split(' ')[1];
			const params = parseArgs(line.split(' ').slice(2));

			if (prefix.toLowerCase() === 'portal') {

				if (this.commands.has(cmdName)) {

					const cmd = this.commands.get(cmdName);

					return cmd.execute(params);
				}

			}
		});
	}

	async loadDefaultCommands() {
		const files = await fs.readdir('./lib/handlers/command/commands');

		for (const file of files) {
			const commandFile = require(`./commands/${file}`);
			console.log(commandFile);
			const command = new commandFile[file.replace(/\.js/g, '')](this.portal);
			this.commands.set(command.commandName, command);
		}

		return;
	}

	getCommandNames() {
		return Array.from(this.commands.keys());
	}
}

module.exports = {
	commandHandler,
};