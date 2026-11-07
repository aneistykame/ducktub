import { defineBoot } from '#q-app'
import { watch } from 'vue'
import { api } from '@/boot/axios'
import { useAuthStore } from '@/stores/auth'

const loginRoute = (from) => ({
  name: 'login',
  query: { redirect: from.fullPath },
})

// this boot file wires together authentication handling with router
export default defineBoot(({ router, store }) => {
  const auth = useAuthStore(store)

  // if the user was logged out (logout, expired session), redirect to login
  watch(
    () => auth.isAuthenticated,
    (isAuthenticated, wasAuthenticated) => {
      if (wasAuthenticated && !isAuthenticated) {
        router.push(loginRoute(router.currentRoute.value))
      }
    },
  )

  // server returned 401 (e.g. session expired), so we forget the user
  api.interceptors.response.use(undefined, (error) => {
    if (error.response?.status === 401 && !error.config?.dontTriggerLogout) {
      auth.user = null
    }

    return Promise.reject(error)
  })

  // check the logged in user on every route change
  router.beforeEach(async (to) => {
    const isAuthenticated = await auth.check()

    if (to.meta.requiresAuth && !isAuthenticated) return loginRoute(to)
    if (to.meta.guestOnly && isAuthenticated) return { name: 'home' }
  })
})
