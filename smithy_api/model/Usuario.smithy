$version: "2"

namespace com.fbook.usuario

use com.fbook.errors#ValidationError
use com.fbook.errors#NotFoundException
use com.fbook.errors#ConflictException
use com.fbook.errors#InternalServerError

integer UsuarioId

structure Usuario {
    @required
    id: UsuarioId

    @required
    @length(max: 30)
    nombre: String

    @required
    @length(max: 40)
    correo: String

    @length(max: 300)
    password: String

    fechaRegistro: Timestamp
}

list UsuarioList {
    member: Usuario
}

// Create Usuario

structure CreateUsuarioInput {
    @required
    @length(max: 30)
    nombre: String

    @required
    @length(max: 40)
    correo: String

    @required
    @length(max: 300)
    password: String
}

structure CreateUsuarioOutput {
    @httpPayload
    usuario: Usuario
}

@tags(["Usuarios"])
@http(method: "POST", uri: "/v1/usuarios", code: 201)
operation CreateUsuario {
    input: CreateUsuarioInput
    output: CreateUsuarioOutput
    errors: [ValidationError, ConflictException, InternalServerError]
}

// Get Usuario

structure GetUsuarioInput {
    @required
    @httpLabel
    id: UsuarioId
}

structure GetUsuarioOutput {
    @httpPayload
    usuario: Usuario
}

@readonly
@tags(["Usuarios"])
@http(method: "GET", uri: "/v1/usuarios/{id}", code: 200)
operation GetUsuario {
    input: GetUsuarioInput
    output: GetUsuarioOutput
    errors: [NotFoundException, InternalServerError]
}

// Update Usuario

structure UpdateUsuarioInput {
    @required
    @httpLabel
    id: UsuarioId

    @length(max: 30)
    nombre: String

    @length(max: 40)
    correo: String

    @length(max: 300)
    password: String
}

structure UpdateUsuarioOutput {
    @httpPayload
    usuario: Usuario
}

@idempotent
@tags(["Usuarios"])
@http(method: "PUT", uri: "/v1/usuarios/{id}", code: 200)
operation UpdateUsuario {
    input: UpdateUsuarioInput
    output: UpdateUsuarioOutput
    errors: [ValidationError, NotFoundException, ConflictException, InternalServerError]
}

// Delete Usuario

structure DeleteUsuarioInput {
    @required
    @httpLabel
    id: UsuarioId
}

@idempotent
@tags(["Usuarios"])
@http(method: "DELETE", uri: "/v1/usuarios/{id}", code: 204)
operation DeleteUsuario {
    input: DeleteUsuarioInput
    output: Unit
    errors: [NotFoundException, InternalServerError]
}

// List Usuarios

structure ListUsuariosInput {
    @httpQuery("nextToken")
    nextToken: String

    @httpQuery("maxResults")
    maxResults: Integer
}

structure ListUsuariosOutput {
    items: UsuarioList

    nextToken: String
}

@readonly
@tags(["Usuarios"])
@http(method: "GET", uri: "/v1/usuarios", code: 200)
operation ListUsuarios {
    input: ListUsuariosInput
    output: ListUsuariosOutput
    errors: [InternalServerError]
}

