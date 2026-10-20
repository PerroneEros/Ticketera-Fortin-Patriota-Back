import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../database/db', async () => {
  const { createMigratedSequelize } = await import('../database/testing/testDb')
  return { default: await createMigratedSequelize() }
})

import sequelize from '../database/db'
import { resetData } from '../database/testing/testDb'
import { initAssociations } from '../model/associations'
import Category from '../model/category'
import Product from '../model/product'
import { categoryService } from './categoryService'

initAssociations()

beforeEach(async () => {
  await resetData(sequelize)
})

describe('categoryService.createCategory', () => {
  it('stores the trimmed name', async () => {
    const created = await categoryService.createCategory({ name: '  Bebidas  ' })
    expect(created.name).toBe('Bebidas')
  })

  it('rejects a duplicate name regardless of case and spaces', async () => {
    await categoryService.createCategory({ name: 'Bebidas' })
    await expect(categoryService.createCategory({ name: ' bebidas ' })).rejects.toThrow(
      'Ya existe una categoría'
    )
    expect(await Category.count()).toBe(1)
  })
})

describe('categoryService.deleteCategory', () => {
  it('moves its products to "General" before deleting it', async () => {
    const general = await Category.create({ name: 'General' })
    const comidas = await Category.create({ name: 'Comidas' })
    const pancho = await Product.create({
      name: 'Pancho',
      price: 2000,
      category_id: comidas.category_id,
      isActive: true
    })

    await categoryService.deleteCategory(String(comidas.category_id))

    expect(await Category.findByPk(comidas.category_id)).toBeNull()
    await pancho.reload()
    expect(pancho.category_id).toBe(general.category_id)
  })

  it('keeps the products where they were if the deletion fails', async () => {
    await Category.create({ name: 'General' })
    const comidas = await Category.create({ name: 'Comidas' })
    const pancho = await Product.create({
      name: 'Pancho',
      price: 2000,
      category_id: comidas.category_id,
      isActive: true
    })
    vi.spyOn(Category.prototype, 'destroy').mockRejectedValueOnce(new Error('disk full'))

    await expect(categoryService.deleteCategory(String(comidas.category_id))).rejects.toThrow(
      'disk full'
    )

    await pancho.reload()
    expect(pancho.category_id).toBe(comidas.category_id)
  })

  it('never deletes the "General" category', async () => {
    const general = await Category.create({ name: 'General' })
    await expect(categoryService.deleteCategory(String(general.category_id))).rejects.toThrow(
      'no puede ser eliminada'
    )
  })
})
