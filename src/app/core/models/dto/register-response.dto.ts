import { User } from '../user.model'

export type RegisterResponseDto = {
  message: string
  user: User
}