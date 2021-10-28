const { Portal } = require('./lib/handlers/portal');

const chalk = require('chalk');
const clear = require('clear');
const figlet = require('figlet');

clear();

console.log(
	chalk.blue(
		figlet.textSync('Portal', { horizontalLayout: 'full' }),
	),
);

const portal = new Portal();
portal.getLogger().info('To begin using Bedrock Portal enter "portal create" or "portal help" to get a list of commands');