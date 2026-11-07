import User from '#models/user'
import { loginValidator } from '#validators/user'
import type { HttpContext } from '@adonisjs/core/http'
import UserTransformer from '#transformers/user_transformer'

export default class SessionController {
  /**
   * Verify credentials and login the user using the session guard.
   * The session id is stored in an encrypted httpOnly cookie
   * which the browser sends with every subsequent request.
   */
  async store({ request, auth, serialize }: HttpContext) {
    const { login, password } = await request.validateUsing(loginValidator)

    const user = await User.verifyCredentials(login, password)
    await auth.use('web').login(user)

    return serialize({
      user: UserTransformer.transform(user),
    })
  }

  /**
   * Logout the user by destroying the session
   */
  async destroy({ auth }: HttpContext) {
    await auth.use('web').logout()

    return {
      message: 'Logged out successfully',
    }
  }
}
