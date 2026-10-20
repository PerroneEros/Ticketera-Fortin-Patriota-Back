import axios from 'axios'

// 127.0.0.1 and not localhost: the API only listens on IPv4 loopback, and localhost may resolve to ::1.
export const apiClient = axios.create({ baseURL: 'http://127.0.0.1:34567/api' })

let tokenPromise: Promise<string> | null = null

apiClient.interceptors.request.use(async (config) => {
  tokenPromise ??= window.api.getApiToken()
  config.headers.set('x-api-token', await tokenPromise)
  return config
})
