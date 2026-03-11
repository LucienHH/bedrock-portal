# V2 Migration Guide

This guide covers the breaking changes required to move from v1.x to v2.x.

## Summary

The main API changes in v2 are:

- `authflow` has been renamed to `host` if you previously set a custom authflow in the constructor
- additional accounts are now configured with `peers` on `BedrockPortal`
- `Modules.MultipleAccounts` has been removed
- account-oriented modules automatically operate on the primary host and any configured peers

## Constructor Changes

If you did not pass `authflow` in v1, you do not need to add `host` in v2 unless you want to override the default account configuration.

### v1

```js
const portal = new BedrockPortal({
  ip: 'your.server.ip',
  port: 19132,
  authflow: new Authflow('main-account', './', {
    authTitle: Titles.MinecraftIOS,
    deviceType: 'iOS',
    flow: 'sisu',
  }),
})
```

### v2

```js
const portal = new BedrockPortal({
  ip: 'your.server.ip',
  port: 19132,
  host: new Authflow('main-account', './', {
    authTitle: Titles.MinecraftIOS,
    deviceType: 'iOS',
    flow: 'sisu',
  }),
})
```

You can also pass a plain config object instead of an `Authflow` instance:

```js
const portal = new BedrockPortal({
  ip: 'your.server.ip',
  port: 19132,
  host: {
    username: 'main-account',
    cache: './',
    options: {
      authTitle: Titles.MinecraftIOS,
      deviceType: 'iOS',
      flow: 'sisu',
    },
  },
})
```

## Multiple Account Changes

### v1

```js
const portal = new BedrockPortal({
  ip: 'your.server.ip',
  port: 19132,
})

portal.use(Modules.MultipleAccounts, {
  accounts: [
    new Authflow('account1', './', {
      authTitle: Titles.MinecraftIOS,
      deviceType: 'iOS',
      flow: 'sisu',
    }),
    new Authflow('account2', './', {
      authTitle: Titles.MinecraftIOS,
      deviceType: 'iOS',
      flow: 'sisu',
    }),
  ],
})
```

### v2

```js
const portal = new BedrockPortal({
  ip: 'your.server.ip',
  port: 19132,
  peers: [
    new Authflow('account1', './', {
      authTitle: Titles.MinecraftIOS,
      deviceType: 'iOS',
      flow: 'sisu',
    }),
    // or with a config object instead of an Authflow instance:
    {
      username: 'account2',
    },
  ],
})
```

## Module Behavior Changes

Modules that interact with Xbox accounts now automatically use all connected accounts.

This affects modules such as:

- `AutoFriendAdd`
- `AutoFriendAccept`
- `InviteOnMessage`

You do not need to add a separate module to make those features work across peer accounts.

## Migration Checklist

- Rename `authflow` to `host` if your v1 code explicitly set `authflow`
- Move any `Modules.MultipleAccounts` configuration into `peers`
- Remove `portal.use(Modules.MultipleAccounts, ...)`
