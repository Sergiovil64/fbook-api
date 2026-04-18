$version: "2"

namespace com.fbook.reaccion

use com.fbook.errors#ValidationError
use com.fbook.errors#NotFoundException
use com.fbook.errors#ConflictException
use com.fbook.errors#InternalServerError

integer ReaccionId

structure Reaccion {
    @required
    id: ReaccionId

    @required
    idPublicacion: Integer

    @required
    idUsuario: Integer

    @required
    meGusta: Boolean

    @required
    meEncanta: Boolean

    @required
    meImporta: Boolean

    @required
    meDivierte: Boolean

    @required
    meAsombra: Boolean

    @required
    meEntristece: Boolean

    @required
    meEnoja: Boolean

    @required
    fPublicacion: Timestamp

    @required
    @length(max: 20)
    estado: String
}

list ReaccionList {
    member: Reaccion
}

// Create Reaccion

structure CreateReaccionInput {
    @required
    idPublicacion: Integer

    @required
    idUsuario: Integer

    @required
    meGusta: Boolean

    @required
    meEncanta: Boolean

    @required
    meImporta: Boolean

    @required
    meDivierte: Boolean

    @required
    meAsombra: Boolean

    @required
    meEntristece: Boolean

    @required
    meEnoja: Boolean

    @required
    @length(max: 20)
    estado: String
}

structure CreateReaccionOutput {
    @httpPayload
    reaccion: Reaccion
}

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

@readonly
@tags(["Reacciones"])
@http(method: "GET", uri: "/v1/reacciones", code: 200)
operation ListReacciones {
    input: ListReaccionInput
    output: ListReaccionOutput
    errors: [InternalServerError]
}

