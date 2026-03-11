import { User } from '../user.model'

export type LoginResponseDto = {
  token: string
  user: User
}