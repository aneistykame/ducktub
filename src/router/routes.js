const routes = [
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    children: [
      { path: '', redirect: { name: 'home' } },
      {
        path: 'auth/login',
        name: 'login',
        meta: { guestOnly: true },
        component: () => import('@/pages/AuthPage.vue'),
      },
      {
        path: 'auth/register',
        name: 'register',
        meta: { guestOnly: true },
        component: () => import('@/pages/AuthPage.vue'),
      },
      {
        path: 'chat',
        name: 'home',
        meta: { requiresAuth: true },
        component: () => import('@/pages/IndexPage.vue'),
      },
    ],
  },

  {
    path: '/:catchAll(.*)*',
    component: () => import('@/pages/ErrorNotFound.vue'),
  },
]

export default routes
