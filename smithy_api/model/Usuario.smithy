$version: "2"

namespace com.fbook.usuario

use com.fbook.errors#ValidationError
use com.fbook.errors#NotFoundException
use com.fbook.errors#ConflictException
use com.fbook.errors#InternalServerError

string UsuarioId

@documentation("Representa un usuario registrado en la plataforma.")
structure Usuario {
    @documentation("Identificador único del usuario.")
    @required
    id: UsuarioId

    @documentation("Nombre completo del usuario. Máximo 30 caracteres.")
    @required
    @length(max: 30)
    nombre: String

    @documentation("Correo electrónico único del usuario. Máximo 40 caracteres.")
    @required
    @length(max: 40)
    correo: String

    @documentation("Fecha y hora de registro del usuario.")
    fechaRegistro: Timestamp
}

list UsuarioList {
    member: Usuario
}

// Create Usuario

@documentation("Datos requeridos para crear un nuevo usuario.")
structure CreateUsuarioInput {
    @documentation("Nombre completo del usuario. Máximo 30 caracteres.")
    @required
    @length(max: 30)
    nombre: String

    @documentation("Correo electrónico único del usuario. Máximo 40 caracteres.")
    @required
    @length(max: 40)
    correo: String

    @documentation("Contraseña temporal del usuario. Solo se usa en la creación y no se almacena. Máximo 300 caracteres.")
    @required
    @length(max: 300)
    password: String
}

structure CreateUsuarioOutput {
    @httpPayload
    usuario: Usuario
}

@documentation("Crea un nuevo usuario en la plataforma.")
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

@documentation("Obtiene los datos de un usuario por su ID.")
@readonly
@tags(["Usuarios"])
@http(method: "GET", uri: "/v1/usuarios/{id}", code: 200)
operation GetUsuario {
    input: GetUsuarioInput
    output: GetUsuarioOutput
    errors: [NotFoundException, InternalServerError]
}

// Update Usuario

@documentation("Datos opcionales para actualizar un usuario existente.")
structure UpdateUsuarioInput {
    @documentation("Identificador del usuario a actualizar.")
    @required
    @httpLabel
    id: UsuarioId

    @documentation("Nuevo nombre del usuario. Máximo 30 caracteres.")
    @length(max: 30)
    nombre: String

    @documentation("Nuevo correo electrónico del usuario. Máximo 40 caracteres.")
    @length(max: 40)
    correo: String
}

structure UpdateUsuarioOutput {
    @httpPayload
    usuario: Usuario
}

@documentation("Actualiza los datos de un usuario existente.")
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

@documentation("Elimina un usuario de la plataforma por su ID.")
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

@documentation("Lista todos los usuarios registrados con soporte de paginación.")
@readonly
@tags(["Usuarios"])
@http(method: "GET", uri: "/v1/usuarios", code: 200)
operation ListUsuarios {
    input: ListUsuariosInput
    output: ListUsuariosOutput
    errors: [InternalServerError]
}

