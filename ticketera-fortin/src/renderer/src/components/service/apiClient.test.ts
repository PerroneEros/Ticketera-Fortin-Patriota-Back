// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from './apiClient'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('apiClient', () => {
  it('targets the loopback API and sends the token from the preload on every request', async () => {
    const getApiToken = vi.fn(() => Promise.resolve('secret-token'))
    window.api = { getApiToken } as unknown as Window['api']

    const seen: { url?: string; token?: unknown }[] = []
    const adapter = vi.fn(async (config) => {
      seen.push({ url: `${config.baseURL}${config.url}`, token: config.headers.get('x-api-token') })
      return { data: [], status: 200, statusText: 'OK', headers: {}, config }
    })

    await apiClient.get('/products', { adapter })
    await apiClient.get('/categories', { adapter })

    expect(seen).toEqual([
      { url: 'http://127.0.0.1:34567/api/products', token: 'secret-token' },
      { url: 'http://127.0.0.1:34567/api/categories', token: 'secret-token' }
    ])
    // The token is fetched once and reused.
    expect(getApiToken).toHaveBeenCalledOnce()
  })
})
