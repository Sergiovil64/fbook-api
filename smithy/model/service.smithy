$version: "2"

namespace com.fbook.services

use aws.protocols#restJson1

use com.fbook.usuario#CreateUsuario
use com.fbook.usuario#GetUsuario
use com.fbook.usuario#UpdateUsuario
use com.fbook.usuario#DeleteUsuario
use com.fbook.usuario#ListUsuarios

use com.fbook.amistad#CreateAmistad
use com.fbook.amistad#GetAmistad
use com.fbook.amistad#UpdateAmistad
use com.fbook.amistad#DeleteAmistad
use com.fbook.amistad#ListAmistades

use com.fbook.publicacion#CreatePublicacion
use com.fbook.publicacion#GetPublicacion
use com.fbook.publicacion#UpdatePublicacion
use com.fbook.publicacion#DeletePublicacion
use com.fbook.publicacion#ListPublicaciones

use com.fbook.comentario#CreateComentario
use com.fbook.comentario#GetComentario
use com.fbook.comentario#UpdateComentario
use com.fbook.comentario#DeleteComentario
use com.fbook.comentario#ListComentarios

use com.fbook.reaccion#CreateReaccion
use com.fbook.reaccion#GetReaccion
use com.fbook.reaccion#UpdateReaccion
use com.fbook.reaccion#DeleteReaccion
use com.fbook.reaccion#ListReacciones

@restJson1
service ApiService {
    version: "2026-04-05"

    operations: [
        // Usuarios
        CreateUsuario
        GetUsuario
        UpdateUsuario
        DeleteUsuario
        ListUsuarios

        // Amistades
        CreateAmistad
        GetAmistad
        UpdateAmistad
        DeleteAmistad
        ListAmistades

        // Publicaciones
        CreatePublicacion
        GetPublicacion
        UpdatePublicacion
        DeletePublicacion
        ListPublicaciones

        // Comentarios
        CreateComentario
        GetComentario
        UpdateComentario
        DeleteComentario
        ListComentarios

        // Reacciones
        CreateReaccion
        GetReaccion
        UpdateReaccion
        DeleteReaccion
        ListReacciones
    ]
}
