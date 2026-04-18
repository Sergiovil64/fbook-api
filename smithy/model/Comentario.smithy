$version: "2"

namespace com.fbook.comentario

use com.fbook.errors#ValidationError
use com.fbook.errors#NotFoundException
use com.fbook.errors#InternalServerError

integer ComentarioId

structure Comentario {
    @required
    id: ComentarioId

    @required
    idPublicacion: Integer

    @required
    idUsuario: Integer

    @required
    @length(max: 300)
    texto: String

    @required
    fComentario: Timestamp
}

list ComentarioList {
    member: Comentario
}

// Create Comentario

structure CreateComentarioInput {
    @required
    idPublicacion: Integer

    @required
    idUsuario: Integer

    @required
    @length(max: 300)
    texto: String
}

structure CreateComentarioOutput {
    @httpPayload
    comentario: Comentario
}

@tags(["Comentarios"])
@http(method: "POST", uri: "/v1/comentarios", code: 201)
operation CreateComentario {
    input: CreateComentarioInput
    output: CreateComentarioOutput
    errors: [ValidationError, InternalServerError]
}

// Get Comentario

structure GetComentarioInput {
    @required
    @httpLabel
    id: ComentarioId
}

structure GetComentarioOutput {
    @httpPayload
    comentario: Comentario
}

@readonly
@tags(["Comentarios"])
@http(method: "GET", uri: "/v1/comentarios/{id}", code: 200)
operation GetComentario {
    input: GetComentarioInput
    output: GetComentarioOutput
    errors: [NotFoundException, InternalServerError]
}

// Update Comentario

structure UpdateComentarioInput {
    @required
    @httpLabel
    id: ComentarioId

    @length(max: 300)
    texto: String
}

structure UpdateComentarioOutput {
    @httpPayload
    comentario: Comentario
}

@idempotent
@tags(["Comentarios"])
@http(method: "PUT", uri: "/v1/comentarios/{id}", code: 200)
operation UpdateComentario {
    input: UpdateComentarioInput
    output: UpdateComentarioOutput
    errors: [ValidationError, NotFoundException, InternalServerError]
}

// Delete Comentario

structure DeleteComentarioInput {
    @required
    @httpLabel
    id: ComentarioId
}

@idempotent
@tags(["Comentarios"])
@http(method: "DELETE", uri: "/v1/comentarios/{id}", code: 204)
operation DeleteComentario {
    input: DeleteComentarioInput
    output: Unit
    errors: [NotFoundException, InternalServerError]
}

// List Comentarios

structure ListComentarioInput {
    @httpQuery("nextToken")
    nextToken: String

    @httpQuery("maxResults")
    maxResults: Integer
}

structure ListComentarioOutput {
    items: ComentarioList

    nextToken: String
}

@readonly
@tags(["Comentarios"])
@http(method: "GET", uri: "/v1/comentarios", code: 200)
operation ListComentarios {
    input: ListComentarioInput
    output: ListComentarioOutput
    errors: [InternalServerError]
}

