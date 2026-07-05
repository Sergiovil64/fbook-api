$version: "2"

namespace com.fbook.comentario

use com.fbook.errors#ValidationError
use com.fbook.errors#NotFoundException
use com.fbook.errors#InternalServerError

string ComentarioId

@documentation("Representa un comentario realizado en una publicación.")
structure Comentario {
    @documentation("Identificador único del comentario.")
    @required
    id: ComentarioId

    @documentation("ID de la publicación a la que pertenece el comentario.")
    @required
    idPublicacion: String

    @documentation("ID del usuario autor del comentario.")
    @required
    idUsuario: String

    @documentation("Texto del comentario. Máximo 300 caracteres.")
    @required
    @length(max: 300)
    texto: String

    @documentation("Fecha y hora en que se realizó el comentario.")
    @required
    fComentario: Timestamp

    @documentation("Estado de moderación de cyberbullying: OK | FLAGGED | UNCHECKED. Campo de salida, calculado por el servicio.")
    moderationStatus: String

    @documentation("Score de toxicidad 0.0–1.0 devuelto por el clasificador. Ausente si moderationStatus es UNCHECKED.")
    toxicityScore: Float

    @documentation("Idioma detectado del texto original (es | en). Ausente si moderationStatus es UNCHECKED.")
    lang: String
}

list ComentarioList {
    member: Comentario
}

// Create Comentario

@documentation("Datos requeridos para crear un nuevo comentario.")
structure CreateComentarioInput {
    @documentation("ID de la publicación a comentar.")
    @required
    idPublicacion: String

    @documentation("ID del usuario que escribió el comentario.")
    @required
    idUsuario: String

    @documentation("Texto del comentario. Máximo 300 caracteres.")
    @required
    @length(max: 300)
    texto: String
}

structure CreateComentarioOutput {
    @httpPayload
    comentario: Comentario
}

@documentation("Crea un nuevo comentario en una publicación.")
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

@documentation("Obtiene los datos de un comentario por su ID.")
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

@documentation("Actualiza el texto de un comentario existente.")
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

@documentation("Elimina un comentario por su ID.")
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

@documentation("Lista todos los comentarios con soporte de paginación.")
@readonly
@tags(["Comentarios"])
@http(method: "GET", uri: "/v1/comentarios", code: 200)
operation ListComentarios {
    input: ListComentarioInput
    output: ListComentarioOutput
    errors: [InternalServerError]
}

