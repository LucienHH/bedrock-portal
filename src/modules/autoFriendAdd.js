/* eslint-disable no-constant-condition */
const Module = require('../classes/Module.js');
const Player = require('../classes/Player.js');

class AutoFriendAdd extends Module {
  constructor() {
    super('autoFriendAdd', 'Automatically adds followers as friends');
    this.options = {
      inviteOnAdd: false,
      conditionToMeet: () => true,
    };
  }

  async run(portal, { rest, rta }) {

    while (!this.stopped) {
      try {

        this.debug('Checking for followers to add');

        const followers = await rest.getXboxFollowers()
          .catch(() => []);

        this.debug(`Found ${followers.length} follower(s)`);

        const needsAdding = followers.filter(res => !res.isFollowedByCaller && this.options.conditionToMeet(res));

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

          await new Promise(resolve => setTimeout(resolve, 2000));
        }

        this.debug('Checking for friends to remove');

        const friends = await rest.getXboxFriends()
          .catch(() => []);

        this.debug(`Found ${friends.length} friend(s)`);

        const needsRemoving = friends.filter(res => !res.isFollowingCaller || !this.options.conditionToMeet(res));

        this.debug(`Removing ${needsRemoving.length} account(s) [${needsRemoving.map(res => res.gamertag).join(', ')}]`);

        for (const account of needsRemoving) {
          await rest.removeXboxFriend(account.xuid).catch(err => {
            throw Error(`Failed to remove ${account.gamertag}`, { cause: err });
          });

          portal.emit('friendRemoved', Player.fromXboxProfile(account));

          this.debug(`Removed ${account.gamertag}`);

          await new Promise(resolve => setTimeout(resolve, 2000));
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
