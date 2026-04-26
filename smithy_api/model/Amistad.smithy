$version: "2"

namespace com.fbook.amistad

use com.fbook.errors#ValidationError
use com.fbook.errors#NotFoundException
use com.fbook.errors#ConflictException
use com.fbook.errors#InternalServerError

string AmistadId

@documentation("Representa una relación de amistad entre dos usuarios.")
structure Amistad {
    @documentation("Identificador único de la amistad.")
    @required
    id: AmistadId

    @documentation("ID del primer usuario en la relación.")
    @required
    idUsuario1: Integer

    @documentation("ID del segundo usuario en la relación.")
    @required
    idUsuario2: Integer

    @documentation("Estado de la amistad (ej: pendiente, aceptada, rechazada). Máximo 20 caracteres.")
    @required
    @length(max: 20)
    estado: String
}

list AmistadList {
    member: Amistad
}

// Create Amistad

@documentation("Datos requeridos para crear una nueva amistad.")
structure CreateAmistadInput {
    @documentation("ID del primer usuario en la relación.")
    @required
    idUsuario1: Integer

    @documentation("ID del segundo usuario en la relación.")
    @required
    idUsuario2: Integer

    @documentation("Estado inicial de la amistad. Máximo 20 caracteres.")
    @required
    @length(max: 20)
    estado: String
}

structure CreateAmistadOutput {
    @httpPayload
    amistad: Amistad
}

@documentation("Crea una nueva relación de amistad entre dos usuarios.")
@tags(["Amistades"])
@http(method: "POST", uri: "/v1/amistades", code: 201)
operation CreateAmistad {
    input: CreateAmistadInput
    output: CreateAmistadOutput
    errors: [ValidationError, ConflictException, InternalServerError]
}

// Get Amistad

structure GetAmistadInput {
    @required
    @httpLabel
    id: AmistadId
}

structure GetAmistadOutput {
    @httpPayload
    amistad: Amistad
}

@documentation("Obtiene los datos de una amistad por su ID.")
@readonly
@tags(["Amistades"])
@http(method: "GET", uri: "/v1/amistades/{id}", code: 200)
operation GetAmistad {
    input: GetAmistadInput
    output: GetAmistadOutput
    errors: [NotFoundException, InternalServerError]
}

// Update Amistad

structure UpdateAmistadInput {
    @required
    @httpLabel
    id: AmistadId

    @length(max: 20)
    estado: String
}

structure UpdateAmistadOutput {
    @httpPayload
    amistad: Amistad
}

@documentation("Actualiza el estado de una amistad existente.")
@idempotent
@tags(["Amistades"])
@http(method: "PUT", uri: "/v1/amistades/{id}", code: 200)
operation UpdateAmistad {
    input: UpdateAmistadInput
    output: UpdateAmistadOutput
    errors: [ValidationError, NotFoundException, InternalServerError]
}

// Delete Amistad

structure DeleteAmistadInput {
    @required
    @httpLabel
    id: AmistadId
}

@documentation("Elimina una amistad por su ID.")
@idempotent
@tags(["Amistades"])
@http(method: "DELETE", uri: "/v1/amistades/{id}", code: 204)
operation DeleteAmistad {
    input: DeleteAmistadInput
    output: Unit
    errors: [NotFoundException, InternalServerError]
}

// List Amistades

structure ListAmistadInput {
    @httpQuery("nextToken")
    nextToken: String

    @httpQuery("maxResults")
    maxResults: Integer
}

structure ListAmistadOutput {
    items: AmistadList

    nextToken: String
}

@documentation("Lista todas las amistades con soporte de paginación.")
@readonly
@tags(["Amistades"])
@http(method: "GET", uri: "/v1/amistades", code: 200)
operation ListAmistades {
    input: ListAmistadInput
    output: ListAmistadOutput
    errors: [InternalServerError]
}

