$version: "2"

namespace com.fbook.amistad

use com.fbook.errors#ValidationError
use com.fbook.errors#NotFoundException
use com.fbook.errors#ConflictException
use com.fbook.errors#InternalServerError

integer AmistadId

structure Amistad {
    @required
    id: AmistadId

    @required
    idUsuario1: Integer

    @required
    idUsuario2: Integer

    @required
    @length(max: 20)
    estado: String
}

list AmistadList {
    member: Amistad
}

// Create Amistad

structure CreateAmistadInput {
    @required
    idUsuario1: Integer

    @required
    idUsuario2: Integer

    @required
    @length(max: 20)
    estado: String
}

structure CreateAmistadOutput {
    @httpPayload
    amistad: Amistad
}

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

@readonly
@tags(["Amistades"])
@http(method: "GET", uri: "/v1/amistades", code: 200)
operation ListAmistades {
    input: ListAmistadInput
    output: ListAmistadOutput
    errors: [InternalServerError]
}

