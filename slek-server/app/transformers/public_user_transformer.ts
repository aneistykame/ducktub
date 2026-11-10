import type User from '#models/user'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class PublicUserTransformer extends BaseTransformer<User> {
  toObject() {
    return this.pick(this.resource, [
      'id',
      'firstName',
      'lastName',
      'nickName',
      'status',
      'initials',
    ])
  }
}
