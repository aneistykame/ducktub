import User from '#models/user'
import type { HttpContext } from '@adonisjs/core/http'
import PublicUserTransformer from '#transformers/public_user_transformer'

export default class UsersController {
  async index({ serialize }: HttpContext) {
    const users = await User.query().orderBy('nick_name', 'asc')

    return serialize({
      users: PublicUserTransformer.transform(users),
    })
  }
}
