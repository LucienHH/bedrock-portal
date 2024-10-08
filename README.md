# BedrockPortal
[![NPM version](https://img.shields.io/npm/v/bedrock-portal.svg)](http://npmjs.com/package/bedrock-portal)
[![Discord](https://img.shields.io/badge/chat-on%20discord-brightgreen.svg)](https://discord.gg/KTyd9HWuBD)

Handles and creates a Minecraft Bedrock game session which will redirect players to the specified server. Join our [Discord](https://discord.com/invite/KTyd9HWuBD) for support.

## Installation
```shell
npm install bedrock-portal
```

### Warning
This package is not meant to be used with your main account. It is meant to be used with alt accounts. If you use this package with your main account, you may be banned from the XSAPI. This package is not affiliated with Mojang or Microsoft.

## Usage

### BedrockPortal(authflow, options)
**Parameters**
- authflow - Takes an **Authflow** instance from [prismarine-auth](https://github.com/PrismarineJS/prismarine-auth), you can see the documentation for this [here.](https://github.com/PrismarineJS/prismarine-auth#authflow)
- options
  - **ip** - The IP address of the server to redirect players to (required)
  - **port** - The port of the server to redirect players to | default: 19132
  - **joinability** - The joinability of the session  | default: FriendsOfFriends
  - **world** - The world config to use for the session. Changes the session card which is displayed in the Minecraft client. (optional)
	  - **hostName** - string
	  - **name** - string
	  - **version** - string
	  - **memberCount** - number
	  - **maxMemberCount** - number

### Create a session redirect to a server
```js
const { BedrockPortal, Joinability } = require('bedrock-portal');
const { Authflow, Titles } = require('prismarine-auth');

const main = async () => {
  const auth = new Authflow('example', './', { authTitle: Titles.MinecraftNintendoSwitch, deviceType: 'Nintendo', flow: 'live' });
  
  const portal = new BedrockPortal(auth, {
    // The server IP & port to redirect players to
    ip: 'geyserconnect.net',
    port: 19132,

     // The joinability of the session. Joinability.FriendsOfFriends, Joinability.FriendsOnly, Joinability.InviteOnly
    joinability: Joinability.FriendsOfFriends
  });

  await portal.start();
	
  // accepts a player's gamertag or xuid
  await portal.invitePlayer('p3')

};

main();
```

## Modules

Modules are used to extend the functionality of the BedrockPortal class.

### ServerFormList

Instead of redirecting players to a server, the portal will display a list of servers to join from a form. `#.use(Modules.serverFormList, options);`

Options:
- **form**: Form - The form to display to the player. At the moment only simple forms are supported. (required)
- **timeout**: number - The time in milliseconds before the player is kicked from the session if they don't select a server (default: 60000ms)
- **timeoutMessage**: string - The message to display to the player when they are kicked from the session (default: 'You took too long to select a server!')

The form will be sent to the player when they join the server and every 5 seconds after they clost the form.

```js
const { BedrockPortal, Joinability, Modules } = require('bedrock-portal')
const { Authflow, Titles } = require('prismarine-auth')

const main = async () => {
  const auth = new Authflow('example', './', { authTitle: Titles.XboxAppIOS, deviceType: 'iOS', flow: 'sisu' })

  const portal = new BedrockPortal(auth)

  portal.use(Modules.ServerFromList, {
    form: {
      title: '§l§aServer Form List',
      content: '§7Please select a server to join',
      buttons: [
        { text: '§8Anarchy Server\n§7Click Here§!', ip: 'bedrock.opblocks.com', port: 19132 },
        { text: '§7Creative Server\n§7Click Here§', ip: 'bedrock.opblocks.com', port: 19132 },
        { text: '§6Survival Server\n§7Click Here§!', ip: 'bedrock.opblocks.com', port: 19132 },
      ],
    },
    timeout: 60000,
    timeoutMessage: '§cYou took too long to select a server!',
  })

  await portal.start()
}

main()
```

### MultipleAccounts

Allows the portal to use multiple accounts to redirect players to the server. `#.use(Modules.MultipleAccounts, options);`

Options:
- **accounts**: Authflow[] - An array of authflows from [prismarine-auth](https://github.com/PrismarineJS/prismarine-auth), these accounts are automatically added to the host session and allows players to add them as a friend to join the game. (required)

```js
const { Authflow, Titles } = require('prismarine-auth')
const { BedrockPortal, Modules } = require('bedrock-portal')

const main = async () => {
  const auth = new Authflow('example', './', { authTitle: Titles.MinecraftNintendoSwitch, deviceType: 'Nintendo', flow: 'live' })

  const portal = new BedrockPortal(auth, {
    ip: 'geyserconnect.net',
    port: 19132,
  })

  portal.use(Modules.AutoFriendAdd, {
    inviteOnAdd: true,
  })

  portal.use(Modules.MultipleAccounts, {
    accounts: [
      new Authflow('account1', './', { authTitle: Titles.MinecraftNintendoSwitch, deviceType: 'Nintendo', flow: 'live' }),
      new Authflow('account2', './', { authTitle: Titles.MinecraftNintendoSwitch, deviceType: 'Nintendo', flow: 'live' }),
    ],
  })

  await portal.start()
}

main()
```


### RedirectFromRealm

> Requires [bedrock-protocol](https://github.com/PrismarineJS/bedrock-protocol) to be installed. `npm install bedrock-protocol`

Invites players when they join a Realm to the specified server or if they use the chat command. `#.use(Modules.redirectFromRealm, options);`

Options:
- **clientOptions**: ClientOptions - The client options to use when connecting to the Realm. These are passed directly to a [bedrock-protocol createClient](https://github.com/PrismarineJS/bedrock-protocol/blob/master/docs/API.md#becreateclientoptions--client) function. See the documentation for more information. 
- **chatCommand**: object - Options for the chat command
  - **enabled**: boolean - Whether sending the command in chat should trigger an invite (default: true)
  - **message**: string - The message to send in chat to run the command (default: 'invite')
  - **cooldown**: number - The cooldown between being able to send the command in chat (default: 60000ms)

```js
const { BedrockPortal, Modules } = require('bedrock-portal');

const portal = new BedrockPortal(auth, { ... })

portal.use(Modules.RedirectFromRealm, {
  // The client options to use when connecting to the Realm.
  clientOptions: {
    realms: {
      realmInvite: ''
    }
  },
  // Options for the chat command
  chatCommand: {
    // Whether sending the command in chat should trigger an invite (optional - defaults to true)
    enabled: true,
    // The message to send in chat to run the command (optional - defaults to 'invite')
    message: 'invite',
    // The cooldown between being able to send the command in chat (optional - defaults to 60000ms)
    cooldown: 60000,
  }
}
```

### UpdateMemberCount

> Requires [bedrock-protocol](https://github.com/PrismarineJS/bedrock-protocol) to be installed. `npm install bedrock-protocol`

Periodically updates the member count of the session. `#.use(Modules.UpdateMemberCount, options);`

Options:
- **updateInterval**: number - How often to update the member count (default: 60000ms)
- **updateMaxMemberCount**: boolean - Whether to update the max member count (default: true)

```js
const { BedrockPortal, Modules } = require('bedrock-portal');

const portal = new BedrockPortal(auth, { ... })

portal.use(Modules.UpdateMemberCount, {
  updateInterval: 60000,
  updateMaxMemberCount: true,
});
```

### AutoFriendAdd

Automatically adds the account's followers as friends and invites them to the game. `#.use(Modules.autoFriendAdd);`

Options:
- **inviteOnAdd**: boolean - Automatically invites recently added friends to the game (default: false)
- **conditionToMeet**: (player: RawPlayer) => boolean - A function that returns a boolean. If the function returns true, followers will be added as a friend and the friends that don't will be removed (default: () => true)
- **checkInterval**: number - How often to check for friends to add/remove (default: 30000ms)
- **addInterval**: number - How long to wait between adding friends (default: 2000ms)
- **removeInterval**: number - How long to wait between removing friends (default: 2000ms)

```js
const { BedrockPortal, Modules } = require('bedrock-portal');

const portal = new BedrockPortal(auth, { ... })

portal.use(Modules.AutoFriendAdd);

// or

portal.use(Modules.AutoFriendAdd, {
  // When a friend is added, automatically invite them to the game
  inviteOnAdd: true,
  // Only add friends that are online and remove friends that are offline
  conditionToMeet: (player) => player.presenceState === 'Online',
  // How often to check for friends to add/remove (optional - defaults to 30000ms)
  checkInterval: 30000,
  // How long to wait between adding friends (optional - defaults to 2000ms)
  addInterval: 2000,
  // How long to wait between removing friends (optional - defaults to 2000ms)
  removeInterval: 2000,
});
```

### AutoFriendAccept

Automatically accepts friend requests sent to the account. `#.use(Modules.autoFriendAdd);`

Options:
- **inviteOnAdd**: boolean - Automatically invites added friends to the game (default: false)
- **conditionToMeet**: (player: Player) => boolean - If the function returns true then the request will be accepted (default: () => true)

```js
const { BedrockPortal, Modules } = require('bedrock-portal');

const portal = new BedrockPortal(auth, { ... })

portal.use(Modules.AutoFriendAccept);

// or

portal.use(Modules.AutoFriendAccept, {
  // When a friend is added invite them to the game
  inviteOnAdd: true,
  // Only accept friends that have 'elite' in their gamertag
  conditionToMeet: (player) => player.gamertag.includes('elite'),
});
```

### InviteOnMessage

Automatically invites players to the game when they send a message in the chat. `#.use(Modules.inviteOnMessage);`

Options:
- **command**: string - The command to use to invite players (default: 'invite')
- **checkInterval**: number - How often to check for messages (default: 30000ms)

```js
const { BedrockPortal, Modules } = require('bedrock-portal');

const portal = new BedrockPortal(auth, { ... })

portal.use(Modules.InviteOnMessage);

// or

portal.use(Modules.InviteOnMessage, {
  // The command to use to invite players (optional - defaults to 'invite')
  command: 'invite',
  // How often to check for messages (optional - defaults to 30000ms)
  checkInterval: 30000,
});
```

## Modules API

Creating a module is easy. You can create a module by extending the `Module` class.

Note: The `stopped` property is set to `true` when the portal is stopped. You can use this to stop the module's loop (if one is present) else the process will not exit.

```js
const { Module } = require('bedrock-portal');

const myModule = class MyModule extends Module {
  constructor() {
    super('myModule', 'Description of my module');
    this.options = {
      option1: true,
    }
  }

  async run(portal) {
    // portal - The BedrockPortal instance

    // Do stuff here
  }

  async stop() {
    super.stop();
    // Do stuff when the module is stopped
  }
}

portal.use(myModule, {
  option1: false,
});

```

## Events

### portal.on('sessionCreated', (session) => void)
Emitted when a session is created.

### portal.on('sessionUpdated', (session) => void)
Emitted when a session is updated.

### portal.on('playerJoin', (player) => void)
Emitted when a player joins the session.

### portal.on('playerLeave', (player) => void)
Emitted when a player leaves the session.


### portal.on('friendAdded', (player) => void)
Emitted when a player is added as a friend. This event is only emitted when the `autoFriendAdd` module is enabled.

### portal.on('friendRemoved', (player) => void)
Emitted when a player is removed as a friend. This event is only emitted when the `autoFriendAdd` module is enabled.

### portal.on('messageReceived', (message) => void)
Emitted when a message is received from a player. This event is only emitted when the `inviteOnMessage` module is enabled.

### portal.on('memberCountUpdate', (memberCount) => void)
Emitted when the member count of the session is updated. This event is only emitted when the `updateMemberCount` module is enabled.

## Debugging

You can enable some debugging output using the `DEBUG` enviroment variable. Through node.js, you can add `process.env.DEBUG = 'bedrock-portal*'` at the top of your code.

## License

[MIT](LICENSE)
