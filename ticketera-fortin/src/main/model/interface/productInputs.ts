export interface CreateProductInput {
  name: string
  price: number
  category_id: number
}

export interface UpdateProductInput {
  name?: string
  price?: number
  category_id?: number
}