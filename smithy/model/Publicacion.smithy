$version: "2"

namespace com.fbook.publicacion

use com.fbook.errors#ValidationError
use com.fbook.errors#NotFoundException
use com.fbook.errors#InternalServerError

integer PublicacionId

structure Publicacion {
    @required
    id: PublicacionId

    @required
    idUsuario: Integer

    @required
    @length(max: 300)
    contenido: String

    @required
    fecha: Timestamp
}

list PublicacionList {
    member: Publicacion
}

// Create Publicacion

structure CreatePublicacionInput {
    @required
    idUsuario: Integer

    @required
    @length(max: 300)
    contenido: String
}

structure CreatePublicacionOutput {
    @httpPayload
    publicacion: Publicacion
}

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

@readonly
@tags(["Publicaciones"])
@http(method: "GET", uri: "/v1/publicaciones", code: 200)
operation ListPublicaciones {
    input: ListPublicacionInput
    output: ListPublicacionOutput
    errors: [InternalServerError]
}

