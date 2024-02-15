import debugFn from 'debug'
import { XboxRTA } from 'xbox-rta'

import Rest from '../rest'
import { BedrockPortal } from '..'

export default class Module {

  public name: string

  public description: string

  public stopped: boolean

  public options: any

  public debug: debugFn.Debugger

  constructor(name: string, description: string) {
    this.name = name

    this.description = description

    this.stopped = false

    this.options = {}

    this.debug = debugFn(`bedrock-portal:${this.name}`)
  }

  applyOptions(options: any) {
    this.options = {
      ...this.options,
      ...options,
    }
  }

  stop() {
    this.stopped = true
  }

  async run(_portal: BedrockPortal, _rest: Rest, _rta: XboxRTA) {
    throw Error('Module.run() must be implemented')
  }

}
