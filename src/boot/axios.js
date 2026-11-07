import { defineBoot } from '#q-app'
import axios from 'axios'

const api = axios.create({
  baseURL: `${import.meta.env.API_URL}/api/v1`,
  // send cookies (session) also to the server running on another port
  withCredentials: true,
})

export default defineBoot(({ app }) => {
  // for use inside Vue files through this.$api
  app.config.globalProperties.$api = api
})

export { api }
