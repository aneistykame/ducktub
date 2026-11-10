import type Channel from '#models/channel'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class ChannelTransformer extends BaseTransformer<Channel> {
  toObject() {
    return {
      ...this.pick(this.resource, ['id', 'name', 'type', 'adminId', 'lastActivityAt', 'createdAt']),
      ...this.resource.$extras.state,
    }
  }
}
