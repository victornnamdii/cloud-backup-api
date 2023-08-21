import { createClient, type RedisClientType } from 'redis'
import RedisStore from 'connect-redis'

class RedisClient {
  client: RedisClientType
  clientConnected: boolean

  constructor () {
    this.client = createClient()
    this.clientConnected = false
    this.client.on('error', (err: Error) => {
      console.log(err.toString())
      this.clientConnected = false
    })
    this.client.on('connect', () => {
      this.clientConnected = true
    })
  }

  async connect (): Promise<boolean> {
    await this.client.connect()
    return this.clientConnected
  }

  async get (key: string): Promise<string | null> {
    return await this.client.get(key)
  }

  async set (key: string, value: string, duration: number): Promise<void> {
    await this.client.set(key, value, {
      EX: duration,
      NX: true
    })
  }

  async del (key: string): Promise<void> {
    await this.client.DEL(key)
  }
}

const redisClient: RedisClient = new RedisClient()

const sessionStore: RedisStore = new RedisStore({
  client: redisClient,
  prefix: 'risevest:'
})

export { redisClient, sessionStore }
