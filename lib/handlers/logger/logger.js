const chalk = require('chalk');
const moment = require('moment');

class Logger {
	success(...content) {
		console.log(`${chalk.gray(moment().format('HH:mm:ss'))} ${chalk.blue('[Portal]')} ${chalk.green('[Success]')}`, ...content);
	}
	info(...content) {
		console.log(`${chalk.gray(moment().format('HH:mm:ss'))} ${chalk.blue('[Portal]')} ${chalk.cyan('[Info]')}`, ...content);
	}
	warn(...content) {
		console.log(`${chalk.gray(moment().format('HH:mm:ss'))} ${chalk.blue('[Portal]')} ${chalk.yellow('[Warn]')}`, ...content);
	}
	heartbeat(...content) {
		console.log(`${chalk.gray(moment().format('HH:mm:ss'))} ${chalk.blue('[Portal]')} ${chalk.redBright('[Heartbeat]')}`, ...content);
	}
	websocket(...content) {
		console.log(`${chalk.gray(moment().format('HH:mm:ss'))} ${chalk.blue('[Portal]')} ${chalk.magenta('[Websocket]')}`, ...content);
	}
	error(...content) {
		console.log(`${chalk.gray(moment().format('HH:mm:ss'))} ${chalk.blue('[Portal]')} ${chalk.red('[Error]')}`, ...content);
	}
}

module.exports = { Logger };