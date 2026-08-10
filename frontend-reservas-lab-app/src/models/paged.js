/**
 * Metadatos de paginacion que equivalen a PagedModel.PageMetadata del backend.
 */
export class PageMetadataDTO {
  constructor({ size, number, totalElements, totalPages }) {
    this.size = size ?? 0
    this.number = number ?? 0
    this.totalElements = totalElements ?? 0
    this.totalPages = totalPages ?? 0
  }

  get firstPage() {
    return this.number <= 0
  }

  get lastPage() {
    return this.number >= this.totalPages - 1
  }
}

/**
 * Modelo generico para respuestas paginadas.
 *
 * El backend expone dos formatos de paginado:
 *  - PagedModel (HATEOAS) para equipos y reservas:
 *      { "_embedded": { "xxxDTOList": [ ... ] }, "page": { size, number, totalElements, totalPages }, "_links": ... }
 *  - Page<T> de Spring para usuarios:
 *      { "content": [ ... ], "number": ..., "size": ..., "totalElements": ..., "totalPages": ... }
 *
 * Esta clase normaliza ambos a un solo modelo.
 */
export class PagedModelDTO {
  constructor({ content, metadata }) {
    this.content = content ?? []
    this.metadata = metadata ?? new PageMetadataDTO({})
  }

  static fromJson(json, itemMapper) {
    if (!json) {
      return new PagedModelDTO({ content: [], metadata: new PageMetadataDTO({}) })
    }

    let rawItems = null

    if (Array.isArray(json.content)) {
      rawItems = json.content
    } else if (json._embedded && typeof json._embedded === 'object') {
      const firstArray = Object.values(json._embedded).find((v) => Array.isArray(v))
      rawItems = firstArray ?? []
    }

    const metadata = new PageMetadataDTO({
      size: json.page?.size ?? json.size,
      number: json.page?.number ?? json.number,
      totalElements: json.page?.totalElements ?? json.totalElements,
      totalPages: json.page?.totalPages ?? json.totalPages,
    })

    const items = (rawItems ?? []).map((item) =>
      itemMapper ? itemMapper(item) : item,
    )

    return new PagedModelDTO({ content: items, metadata })
  }

  get hasItems() {
    return this.content.length > 0
  }

  get hasNext() {
    return this.metadata.number < this.metadata.totalPages - 1
  }

  get hasPrev() {
    return this.metadata.number > 0
  }
}

/**
 * Extrae un recurso de una respuesta EntityModel<T> de Spring HATEOAS
 * (mismo shape que el DTO pero con "_links" adicional).
 */
export function fromEntityModel(json, mapper) {
  if (!json) {
    return null
  }
  return mapper ? mapper(json) : json
}