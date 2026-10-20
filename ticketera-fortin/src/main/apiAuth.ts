import { randomBytes, timingSafeEqual } from 'crypto'
import { NextFunction, Request, RequestHandler, Response } from 'express'

export const API_HOST = '127.0.0.1'
export const API_PORT = 34567
export const API_TOKEN_HEADER = 'x-api-token'

export const generateApiToken = (): string => randomBytes(32).toString('hex')

export function createApiTokenMiddleware(apiToken: string): RequestHandler {
  const expected = Buffer.from(apiToken)
  return (req: Request, res: Response, next: NextFunction): void => {
    const received = Buffer.from(req.get(API_TOKEN_HEADER) ?? '')
    if (received.length !== expected.length || !timingSafeEqual(received, expected)) {
      res.status(401).json({ message: 'No autorizado.' })
      return
    }
    next()
  }
}

// Dev serves the renderer from the Vite URL; the packaged app loads it from file://.
export const getAllowedOrigins = (rendererUrl?: string): string[] =>
  [rendererUrl ? new URL(rendererUrl).origin : undefined, 'null', 'file://'].filter(
    (origin): origin is string => Boolean(origin)
  )
