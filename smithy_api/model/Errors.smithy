$version: "2"

namespace com.fbook.errors

/// 400 — input validation failed
@error("client")
@httpError(400)
structure ValidationError {
    @required
    message: String
}

/// 404 — requested resource does not exist
@error("client")
@httpError(404)
structure NotFoundException {
    @required
    message: String
}

/// 409 — unique constraint violated (e.g. correo duplicado)
@error("client")
@httpError(409)
structure ConflictException {
    @required
    message: String
}

/// 500 — unexpected server-side failure
@error("server")
@httpError(500)
structure InternalServerError {
    @required
    message: String
}
