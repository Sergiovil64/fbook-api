$version: "2"

namespace com.fbook.reaccion

use com.fbook.errors#ValidationError
use com.fbook.errors#NotFoundException
use com.fbook.errors#ConflictException
use com.fbook.errors#InternalServerError

string ReaccionId

@documentation("Representa la reacción de un usuario ante una publicación.")
structure Reaccion {
    @documentation("Identificador único de la reacción.")
    @required
    id: ReaccionId

    @documentation("ID de la publicación a la que pertenece la reacción.")
    @required
    idPublicacion: String

    @documentation("ID del usuario que reaccionó.")
    @required
    idUsuario: String

    @documentation("Indica si el usuario reaccionó con 'Me gusta'.")
    @required
    meGusta: Boolean

    @documentation("Indica si el usuario reaccionó con 'Me encanta'.")
    @required
    meEncanta: Boolean

    @documentation("Indica si el usuario reaccionó con 'Me importa'.")
    @required
    meImporta: Boolean

    @documentation("Indica si el usuario reaccionó con 'Me divierte'.")
    @required
    meDivierte: Boolean

    @documentation("Indica si el usuario reaccionó con 'Me asombra'.")
    @required
    meAsombra: Boolean

    @documentation("Indica si el usuario reaccionó con 'Me entristece'.")
    @required
    meEntristece: Boolean

    @documentation("Indica si el usuario reaccionó con 'Me enoja'.")
    @required
    meEnoja: Boolean

    @documentation("Fecha y hora de la publicación asociada.")
    @required
    fPublicacion: Timestamp

    @documentation("Estado de la reacción. Máximo 20 caracteres.")
    @required
    @length(max: 20)
    estado: String
}

list ReaccionList {
    member: Reaccion
}

// Create Reaccion

@documentation("Datos requeridos para registrar una reacción a una publicación.")
structure CreateReaccionInput {
    @documentation("ID de la publicación a reaccionar.")
    @required
    idPublicacion: String

    @documentation("ID del usuario que reacciona.")
    @required
    idUsuario: String

    @documentation("Indica si el usuario reacciona con 'Me gusta'.")
    @required
    meGusta: Boolean

    @documentation("Indica si el usuario reacciona con 'Me encanta'.")
    @required
    meEncanta: Boolean

    @documentation("Indica si el usuario reacciona con 'Me importa'.")
    @required
    meImporta: Boolean

    @documentation("Indica si el usuario reacciona con 'Me divierte'.")
    @required
    meDivierte: Boolean

    @documentation("Indica si el usuario reacciona con 'Me asombra'.")
    @required
    meAsombra: Boolean

    @documentation("Indica si el usuario reacciona con 'Me entristece'.")
    @required
    meEntristece: Boolean

    @documentation("Indica si el usuario reacciona con 'Me enoja'.")
    @required
    meEnoja: Boolean

    @documentation("Estado de la reacción. Máximo 20 caracteres.")
    @required
    @length(max: 20)
    estado: String
}

structure CreateReaccionOutput {
    @httpPayload
    reaccion: Reaccion
}

@documentation("Registra una nueva reacción de un usuario ante una publicación.")
@tags(["Reacciones"])
@http(method: "POST", uri: "/v1/reacciones", code: 201)
operation CreateReaccion {
    input: CreateReaccionInput
    output: CreateReaccionOutput
    errors: [ValidationError, ConflictException, InternalServerError]
}

// Get Reaccion

structure GetReaccionInput {
    @required
    @httpLabel
    id: ReaccionId
}

structure GetReaccionOutput {
    @httpPayload
    reaccion: Reaccion
}

@documentation("Obtiene los datos de una reacción por su ID.")
@readonly
@tags(["Reacciones"])
@http(method: "GET", uri: "/v1/reacciones/{id}", code: 200)
operation GetReaccion {
    input: GetReaccionInput
    output: GetReaccionOutput
    errors: [NotFoundException, InternalServerError]
}

// Update Reaccion

structure UpdateReaccionInput {
    @required
    @httpLabel
    id: ReaccionId

    meGusta: Boolean

    meEncanta: Boolean

    meImporta: Boolean

    meDivierte: Boolean

    meAsombra: Boolean

    meEntristece: Boolean

    meEnoja: Boolean

    @length(max: 20)
    estado: String
}

structure UpdateReaccionOutput {
    @httpPayload
    reaccion: Reaccion
}

@documentation("Actualiza las reacciones de un registro existente.")
@idempotent
@tags(["Reacciones"])
@http(method: "PUT", uri: "/v1/reacciones/{id}", code: 200)
operation UpdateReaccion {
    input: UpdateReaccionInput
    output: UpdateReaccionOutput
    errors: [ValidationError, NotFoundException, InternalServerError]
}

// Delete Reaccion

structure DeleteReaccionInput {
    @required
    @httpLabel
    id: ReaccionId
}

@documentation("Elimina una reacción por su ID.")
@idempotent
@tags(["Reacciones"])
@http(method: "DELETE", uri: "/v1/reacciones/{id}", code: 204)
operation DeleteReaccion {
    input: DeleteReaccionInput
    output: Unit
    errors: [NotFoundException, InternalServerError]
}

// List Reacciones

structure ListReaccionInput {
    @httpQuery("nextToken")
    nextToken: String

    @httpQuery("maxResults")
    maxResults: Integer
}

structure ListReaccionOutput {
    items: ReaccionList

    nextToken: String
}

@documentation("Lista todas las reacciones con soporte de paginación.")
@readonly
@tags(["Reacciones"])
@http(method: "GET", uri: "/v1/reacciones", code: 200)
operation ListReacciones {
    input: ListReaccionInput
    output: ListReaccionOutput
    errors: [InternalServerError]
}

