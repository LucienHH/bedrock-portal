# BedrockPortal
[![NPM version](https://img.shields.io/npm/v/bedrock-portal.svg)](http://npmjs.com/package/bedrock-portal)
[![Discord](https://img.shields.io/badge/chat-on%20discord-brightgreen.svg)](https://discord.gg/KTyd9HWuBD)

Handles and creates a Minecraft Bedrock game session which will redirect players to the specified server

## Installation
```shell
npm install bedrock-portal
```

### Warning
This package is not meant to be used with your main account. It is meant to be used with alt accounts. If you use this package with your main account, you may be banned from the XSAPI. This package is not affiliated with Mojang or Microsoft.

## Usage

### BedrockPortal(authflow)
**Parameters**
- authflow - Takes an **Authflow** instance from [prismarine-auth](https://github.com/PrismarineJS/prismarine-auth), you can see the documentation for this [here.](https://github.com/PrismarineJS/prismarine-auth#authflow)
- options
  - **ip** - The IP address of the server to redirect players to
  - **port** - The port of the server to redirect players to
  - **disableAltCheck** - Disables the alt check.
  - **joinability** - The joinability of the session, Can be 'friends_of_friends', 'friends_only', 'invite_only'
  - **world** - The world config to use for the session. Changes the session card which is displayed in the Minecraft client.
	  - **hostName** - string
	  - **name** - string
	  - **version** - string
	  - **memberCount** - number
	  - **maxMemberCount** - number
  - **modules** - An object containing modules to enable. See [Modules](#modules) for more information.

### Create a session redirect to a server
```js
const { BedrockPortal } = require('bedrock-portal');
const { Authflow, Titles } = require('prismarine-auth');

const main = async () => {
	const auth = new Authflow('example', './', { authTitle: Titles.MinecraftNintendoSwitch, deviceType: 'Nintendo' });

	const session = new BedrockPortal(auth, {
		ip: 'geyserconnect.net', // The server IP & port to redirect players to
		port: 19132,
		joinability: 'friends_of_friends', // The joinability of the session. Can be 'friends_of_friends', 'friends_only', 'invite_only'
	});

	await session.start();
};

main();
```

## Modules

Modules are used to extend the functionality of the BedrockPortal class. You can find a list of modules below.

```js
new BedrockPortal(auth, {
	...,
	modules: {
		autoFriendAdd: true, // Automatically add friends to the session
	},
})
```

### autoFriendAdd

Automatically adds the account's followers as friends so the session can be joined by them.
* Add `autoFriendAdd: true` to the modules object in the BedrockPortal constructor.


## Debugging

You can enable some debugging output using the `DEBUG` enviroment variable. Through node.js, you can add `process.env.DEBUG = 'bedrock-portal'` at the top of your code.

## License

[MIT](LICENSE)
