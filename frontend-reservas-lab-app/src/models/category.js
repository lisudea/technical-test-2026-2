/**
 * Equivalente al DTO del backend: com.udea.labreservas.dto.CategoryDTO
 */
export class CategoryDTO {
  constructor({ categoryId, categoryName }) {
    this.categoryId = categoryId ?? null
    this.categoryName = categoryName ?? ''
  }

  static fromJson(json) {
    return new CategoryDTO({
      categoryId: json?.categoryId,
      categoryName: json?.categoryName,
    })
  }
}

/**
 * Equivalente al DTO del backend: com.udea.labreservas.dto.CreateCategoryDTO
 */
export class CreateCategoryDTO {
  constructor(categoryName) {
    this.categoryName = categoryName ?? ''
  }

  toJson() {
    return { categoryName: this.categoryName }
  }
}