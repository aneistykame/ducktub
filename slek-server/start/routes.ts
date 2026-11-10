/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import { middleware } from '#start/kernel'
import app from '@adonisjs/core/services/app'
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
        router.get('/:id/messages', [controllers.Messages, 'index'])
        router.post('/:id/messages', [controllers.Messages, 'store'])
      })
      .prefix('channels')
      .use(middleware.auth())

    router.get('users', [controllers.Users, 'index']).use(middleware.auth())

    if (app.inDev) {
      router.post('dev/simulate', [controllers.Messages, 'simulate']).use(middleware.auth())
    }
  })
  .prefix('/api/v1')
