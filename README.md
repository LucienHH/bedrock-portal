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
  - **port** - The port of the server to redirect players to (default: 19132)
  - **joinability** - The joinability of the session (default: Joinability.FriendsOfFriends)
  - **world** - The world config to use for the session. Changes the session card which is displayed in the Minecraft client.
	  - **hostName** - string (default: '{gamertag}'s Portal')
	  - **name** - string (default: 'BedrockPortal')
	  - **version** - string (default: '{BedrockPortal version}')
	  - **memberCount** - number (default: 0)
	  - **maxMemberCount** - number (default: 10)

### Create a session redirect to a server
```js
const { BedrockPortal, Joinability } = require('bedrock-portal');
const { Authflow, Titles } = require('prismarine-auth');

const main = async () => {
  const auth = new Authflow('example', './', { authTitle: Titles.MinecraftNintendoSwitch, deviceType: 'Nintendo', flow: 'live' });
  
  const portal = new BedrockPortal(auth, {
    ip: 'geyserconnect.net', // The server IP & port to redirect players to
    port: 19132,
    joinability: Joinability.InviteOnly, // The joinability of the session. Joinability.FriendsOfFriends, Joinability.FriendsOnly, Joinability.InviteOnly
  });

  await portal.start();
	
  // accepts a player's gamertag or xuid
  await portal.invitePlayer('p3')

};

main();
```

## Modules

Modules are used to extend the functionality of the BedrockPortal class.

### redirectFromRealm

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

portal.use(Modules.redirectFromRealm, {
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

### autoFriendAdd

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

portal.use(Modules.autoFriendAdd);

// or

portal.use(Modules.autoFriendAdd, {
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

### inviteOnMessage

Automatically invites players to the game when they send a message in the chat. `#.use(Modules.inviteOnMessage);`

Options:
- **command**: string - The command to use to invite players (default: 'invite')
- **checkInterval**: number - How often to check for messages (default: 30000ms)

```js
const { BedrockPortal, Modules } = require('bedrock-portal');

const portal = new BedrockPortal(auth, { ... })

portal.use(Modules.inviteOnMessage);

// or

portal.use(Modules.inviteOnMessage, {
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

  async run(portal, { rest, rta }) {
    // portal - The BedrockPortal instance
    // rest - The REST API instance
    // rta - The RTA API instance

    // Do stuff here
  }
}

portal.use(myModule);
```

## Events

### portal.on('sessionCreated', (session) => {})
Emitted when a session is created.

**Parameters**
- session - [Session](#session) object


### portal.on('sessionUpdated', (session) => {})
Emitted when a session is updated.

**Parameters**
- session - [Session](#session) object


### portal.on('playerJoin', (player) => {})
Emitted when a player joins the session.

**Parameters**
- player - [Player](#player) object


### portal.on('playerLeave', (player) => {})
Emitted when a player leaves the session.

**Parameters**
- player - [Player](#player) object


### portal.on('friendAdded', (player) => {})
Emitted when a player is added as a friend. This event is only emitted when the `autoFriendAdd` module is enabled.

**Parameters**
- player - [Player](#player) object

### portal.on('friendRemoved', (player) => {})
Emitted when a player is removed as a friend. This event is only emitted when the `autoFriendAdd` module is enabled.

**Parameters**
- player - [Player](#player) object

### portal.on('messageRecieved', (message) => {})
Emitted when a message is recieved from a player. This event is only emitted when the `inviteOnMessage` module is enabled.

## Objects

### Player

```ts
{
  profile?: {
    xuid: string,
    avatar: string,
    gamerscore: string,
    gamertag: string,
    tier: string,
    reputation: string,
    colour: {
      primaryColour: string,
      secondaryColour: string,
      tertiaryColour: string
    },
    realname: string,
    bio: string,
    location: string,
    modernGamertag: string,
    modernGamertagSuffix: string,
    uniqueModernGamertag: string,
    realnameOverride: string,
    tenureLevel: string,
    watermarks: string,
    isQuarantined: boolean,
    linkedAccounts: []
  }
  session?: {
    titleId: string
    joinTime: string
    index: number
    connectionId: string
    subscriptionId: string
  }
}
```

### Session

```ts
{
  membersInfo: {
    first: number,
    next: number,
    count: number,
    accepted: number,
    active: number
  },
  constants: {
    system: {
      readyRemovalTimeout: number,
      reservedRemovalTimeout: number,
      sessionEmptyTimeout: number,
      inactiveRemovalTimeout: number,
      version: number,
      maxMembersCount: number,
      visibility: string,
      capabilities: {
        connectivity: boolean,
        connectionRequiredForActiveMembers: boolean,
        gameplay: boolean,
        crossPlay: boolean,
        userAuthorizationStyle: boolean
      },
      inviteProtocol: string,
      memberInitialization: {
        membersNeededToStart: number,
      }
    },
    custom: {}
  },
  properties: {
    system: {
      joinRestriction: 'followed' | 'local',
      readRestriction: string,
      turn: []
    },
    custom: {
      Joinability: string,
      hostName: string,
      ownerId: string,
      rakNetGUID: string,
      version: string,
      worldName: string,
      worldType: string,
      protocol: number,
      MemberCount: number,
      MaxMemberCount: number,
      BroadcastSetting: number,
      UsesWebSocketsWebRTCSignaling: boolean,
      UsesMPSDWebRTCSignaling: boolean,
      netherNetEnabled: boolean,
      OnlineCrossPlatformGame: boolean,
      CrossPlayDisabled: boolean,
      TitleId: number,
      SupportedConnections: SessionConnection[],
      levelId: string,
      LanGame: boolean
    }
  },
  servers: {},
  members: {
    [index: number]: SessionMember
  }
  correlationId: string,
  contractVersion: number,
  branch: string,
  changeNumber: number,
  startTime: string
}
```

### RawPlayer

```ts
{
    xuid: string;
    isFavorite: boolean;
    isFollowingCaller: boolean;
    isFollowedByCaller: boolean;
    isIdentityShared: boolean;
    addedDateTimeUtc: string;
    displayName: string;
    realName: string;
    displayPicRaw: string;
    showUserAsAvatar: string;
    gamertag: string;
    gamerScore: string;
    modernGamertag: string;
    modernGamertagSuffix: string;
    uniqueModernGamertag: string;
    xboxOneRep: string;
    presenceState: string;
    presenceText: string;
    presenceDevices: null | any[];
    isBroadcasting: boolean;
    isCloaked: null | boolean;
    isQuarantined: boolean;
    isXbox360Gamerpic: boolean;
    lastSeenDateTimeUtc: string;
    suggestion: null;
    recommendation: null;
    search: null;
    titleHistory: null;
    multiplayerSummary: null;
    recentPlayer: null;
    follower: {
        text: string;
        followedDateTime: string;
    };
    preferredColor: {
        primaryColor: string;
        secondaryColor: string;
        tertiaryColor: string;
    };
    presenceDetails: null;
    titlePresence: null;
    titleSummaries: null;
    presenceTitleIds: null;
    detail: {
        accountTier: string;
        bio: string;
        isVerified: boolean;
        location: string;
        tenure: string;
        watermarks: any[];
        blocked: boolean;
        mute: boolean;
        followerCount: number;
        followingCount: number;
        hasGamePass: boolean;
    };
    communityManagerTitles: null;
    socialManager: null;
    broadcast: null;
    avatar: null;
    linkedAccounts: {
      networkName: string;
      displayName: string;
      showOnProfile: boolean;
      isFamilyFriendly: boolean;
      deeplink: null;
    }[];
    colorTheme: string;
    preferredFlag: string;
    preferredPlatforms: string[];
}
```


## Debugging

You can enable some debugging output using the `DEBUG` enviroment variable. Through node.js, you can add `process.env.DEBUG = 'bedrock-portal*'` at the top of your code.

## License

[MIT](LICENSE)
