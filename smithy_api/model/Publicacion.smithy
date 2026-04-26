$version: "2"

namespace com.fbook.publicacion

use com.fbook.errors#ValidationError
use com.fbook.errors#NotFoundException
use com.fbook.errors#InternalServerError

integer PublicacionId

@documentation("Representa una publicación realizada por un usuario.")
structure Publicacion {
    @documentation("Identificador único de la publicación.")
    @required
    id: PublicacionId

    @documentation("ID del usuario autor de la publicación.")
    @required
    idUsuario: Integer

    @documentation("Contenido de la publicación. Máximo 300 caracteres.")
    @required
    @length(max: 300)
    contenido: String

    @documentation("Fecha y hora en que se realizó la publicación.")
    @required
    fecha: Timestamp
}

list PublicacionList {
    member: Publicacion
}

// Create Publicacion

@documentation("Datos requeridos para crear una nueva publicación.")
structure CreatePublicacionInput {
    @documentation("ID del usuario que realiza la publicación.")
    @required
    idUsuario: Integer

    @documentation("Contenido de la publicación. Máximo 300 caracteres.")
    @required
    @length(max: 300)
    contenido: String
}

structure CreatePublicacionOutput {
    @httpPayload
    publicacion: Publicacion
}

@documentation("Crea una nueva publicación en la plataforma.")
@tags(["Publicaciones"])
@http(method: "POST", uri: "/v1/publicaciones", code: 201)
operation CreatePublicacion {
    input: CreatePublicacionInput
    output: CreatePublicacionOutput
    errors: [ValidationError, InternalServerError]
}

// Get Publicacion

structure GetPublicacionInput {
    @required
    @httpLabel
    id: PublicacionId
}

structure GetPublicacionOutput {
    @httpPayload
    publicacion: Publicacion
}

@documentation("Obtiene los datos de una publicación por su ID.")
@readonly
@tags(["Publicaciones"])
@http(method: "GET", uri: "/v1/publicaciones/{id}", code: 200)
operation GetPublicacion {
    input: GetPublicacionInput
    output: GetPublicacionOutput
    errors: [NotFoundException, InternalServerError]
}

// Update Publicacion

structure UpdatePublicacionInput {
    @required
    @httpLabel
    id: PublicacionId

    @length(max: 300)
    contenido: String
}

structure UpdatePublicacionOutput {
    @httpPayload
    publicacion: Publicacion
}

@documentation("Actualiza el contenido de una publicación existente.")
@idempotent
@tags(["Publicaciones"])
@http(method: "PUT", uri: "/v1/publicaciones/{id}", code: 200)
operation UpdatePublicacion {
    input: UpdatePublicacionInput
    output: UpdatePublicacionOutput
    errors: [ValidationError, NotFoundException, InternalServerError]
}

// Delete Publicacion

structure DeletePublicacionInput {
    @required
    @httpLabel
    id: PublicacionId
}

@documentation("Elimina una publicación por su ID.")
@idempotent
@tags(["Publicaciones"])
@http(method: "DELETE", uri: "/v1/publicaciones/{id}", code: 204)
operation DeletePublicacion {
    input: DeletePublicacionInput
    output: Unit
    errors: [NotFoundException, InternalServerError]
}

// List Publicaciones

structure ListPublicacionInput {
    @httpQuery("nextToken")
    nextToken: String

    @httpQuery("maxResults")
    maxResults: Integer
}

structure ListPublicacionOutput {
    items: PublicacionList

    nextToken: String
}

@documentation("Lista todas las publicaciones con soporte de paginación.")
@readonly
@tags(["Publicaciones"])
@http(method: "GET", uri: "/v1/publicaciones", code: 200)
operation ListPublicaciones {
    input: ListPublicacionInput
    output: ListPublicacionOutput
    errors: [InternalServerError]
}

