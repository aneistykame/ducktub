/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'
import { controllers } from '#generated/controllers'

router.get('/', () => {
  return { hello: 'world' }
})

router
  .group(() => {
    router
      .group(() => {
        router.post('signup', [controllers.NewAccount, 'store'])
        router.post('login', [controllers.Session, 'store'])
      })
      .prefix('auth')
      .as('auth')

    router
      .group(() => {
        router.get('profile', [controllers.Profile, 'show'])
        router.post('logout', [controllers.Session, 'destroy'])
      })
      .prefix('account')
      .as('profile')
      .use(middleware.auth())

    router
      .group(() => {
        router.post('/', [controllers.Channels, 'store'])
        router.get('/', [controllers.Channels, 'index'])
        router.post('/:id/leave', [controllers.Channels, 'leave'])
        router.post('/:id/accept', [controllers.Channels, 'accept'])
        router.post('/:id/decline', [controllers.Channels, 'decline'])
      })
      .prefix('channels')
      .use(middleware.auth())
  })
  .prefix('/api/v1')
