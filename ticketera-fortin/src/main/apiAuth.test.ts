import { describe, expect, it, vi } from 'vitest'
import { Request, Response } from 'express'
import {
  API_TOKEN_HEADER,
  createApiTokenMiddleware,
  generateApiToken,
  getAllowedOrigins
} from './apiAuth'

const fakeRequest = (token?: string): Request =>
  ({ get: (name: string) => (name === API_TOKEN_HEADER ? token : undefined) }) as unknown as Request

const fakeResponse = (): Response & { statusCode?: number; body?: unknown } => {
  const res = {} as Response & { statusCode?: number; body?: unknown }
  res.status = vi.fn((code: number) => {
    res.statusCode = code
    return res
  }) as unknown as Response['status']
  res.json = vi.fn((body: unknown) => {
    res.body = body
    return res
  }) as unknown as Response['json']
  return res
}

describe('createApiTokenMiddleware', () => {
  const token = generateApiToken()
  const middleware = createApiTokenMiddleware(token)

  it('lets the request through when the token matches', () => {
    const next = vi.fn()
    middleware(fakeRequest(token), fakeResponse(), next)
    expect(next).toHaveBeenCalledOnce()
  })

  it.each([
    ['missing', undefined],
    ['wrong', generateApiToken()],
    ['shorter', token.slice(1)]
  ])('rejects a %s token with 401', (_label, sent) => {
    const next = vi.fn()
    const res = fakeResponse()
    middleware(fakeRequest(sent), res, next)
    expect(next).not.toHaveBeenCalled()
    expect(res.statusCode).toBe(401)
  })
})

describe('generateApiToken', () => {
  it('creates a different 64-char token each time', () => {
    const first = generateApiToken()
    expect(first).toHaveLength(64)
    expect(generateApiToken()).not.toBe(first)
  })
})

describe('getAllowedOrigins', () => {
  it('allows the dev renderer origin and the packaged file origins', () => {
    expect(getAllowedOrigins('http://localhost:5173/index.html')).toEqual([
      'http://localhost:5173',
      'null',
      'file://'
    ])
  })

  it('only allows the file origins in production', () => {
    expect(getAllowedOrigins(undefined)).toEqual(['null', 'file://'])
  })
})
