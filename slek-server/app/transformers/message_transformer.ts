import type Message from '#models/message'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class MessageTransformer extends BaseTransformer<Message> {
  toObject() {
    return this.pick(this.resource, ['id', 'channelId', 'authorId', 'content', 'createdAt'])
  }
}
