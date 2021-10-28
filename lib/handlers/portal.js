const { Logger } = require('./logger/logger');
const { commandHandler } = require('./command/commandHandler');
const { authHandler } = require('./authentication/authHandler');
const { apiHandler } = require('./api/apiHandler');
const { sessionHandler } = require('./session/sessionHandler');
const { websocketHandler } = require('./websocket/websocketHandler');
const { friendHandler } = require('./friend/friendHandler');

class Portal {
	constructor() {
		this.logger = new Logger(this);
		this.authHandler = new authHandler(this);
		this.websocketHandler = new websocketHandler(this);
		this.sessionHandler = new sessionHandler(this);
		this.apiHanlder = new apiHandler(this);
		this.commandHandler = new commandHandler(this);
		this.friendHandler = new friendHandler(this);
		this.onStart();
	}

	async onStart() {
		await this.authHandler.onStart();
		await this.websocketHandler.onStart();
		await this.friendHandler.onStart();
		await this.commandHandler.onStart();
	}

	async onEnd() {
		await this.commandHandler.onEnd();
	}

	getLogger() {
		return this.logger;
	}

	getAuthHandler() {
		return this.authHandler;
	}

	getWebsocketHandler() {
		return this.websocketHandler;
	}

	getSessionHandler() {
		return this.sessionHandler;
	}

	getApiHandler() {
		return this.apiHanlder;
	}

	getCommandHandler() {
		return this.commandHandler;
	}
}

module.exports = { Portal };
