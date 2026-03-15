export type ReviewCreateDto = {
  target_id: number | string
  rating: number
  message?: string
  comment?: string
}