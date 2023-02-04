class Module {
  constructor(name, description) {
    this.name = name;
    this.description = description;
    this.stopped = false;
    this.options = {};
    this.debug = require('debug')(`bedrock-portal:${this.name}`);
  }
  applyOptions(options) {
    this.options = options;
  }
  stop() {
    this.stopped = true;
  }
}

module.exports = Module;
