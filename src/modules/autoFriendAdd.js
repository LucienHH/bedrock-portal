/* eslint-disable no-constant-condition */
const Module = require('../classes/Module.js');
const Player = require('../classes/Player.js');

class AutoFriendAdd extends Module {
  constructor() {
    super('autoFriendAdd', 'Automatically adds followers as friends');
    this.options = {
      inviteOnAdd: false,
    };
  }

  async run(portal, { rest, rta }) {

    while (!this.stopped) {
      try {

        this.debug('Checking for followers to add');

        const friends = await rest.getXboxFriends()
          .then(people => people.map(e => e.xuid))
          .catch(() => []);

        const followers = await rest.getXboxFollowers()
          .catch(() => []);

        const needsAdding = followers.filter(res => !friends.includes(res.xuid));

        if (!needsAdding.length) {
          this.debug('No followers to add');
          await new Promise(resolve => setTimeout(resolve, 30000));
          continue;
        }

        this.debug(`Adding ${needsAdding.length} account(s) [${needsAdding.map(res => res.gamertag).join(', ')}]`);

        for (const account of needsAdding) {
          await rest.addXboxFriend(account.xuid).catch(err => {
            throw Error(`Failed to add ${account.gamertag}`, { cause: err });
          });

          if (this.options.inviteOnAdd) {
            await portal.invitePlayer(account.xuid).catch(err => {
              throw Error(`Failed to invite ${account.gamertag}`, { cause: err });
            });
          }

          portal.emit('friendAdded', Player.fromXboxProfile(account));

          this.debug(`Added & invited ${account.gamertag}`);

          await new Promise(resolve => setTimeout(resolve, 10000));
        }
      }
      catch (error) {
        this.debug(`Error: ${error.message}`, error);
      }

      await new Promise(resolve => setTimeout(resolve, 30000));
    }
  }
}

module.exports = AutoFriendAdd;
