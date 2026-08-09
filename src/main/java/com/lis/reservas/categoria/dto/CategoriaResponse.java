package com.lis.reservas.categoria.dto;

/**
 * Response projection for a category.
 *
 * @param idCategoria database identity
 * @param nombre      category name
 * @param descripcion optional description
 */
public record CategoriaResponse(Integer idCategoria, String nombre, String descripcion) {
}