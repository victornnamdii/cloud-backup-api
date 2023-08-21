import 'express-serve-static-core'

interface User {
  id: string
  email: string
  password: string
  first_name: string
  last_name: string
}

declare module 'express-serve-static-core' {
  interface Request {
    user: User | undefined
  }
}
