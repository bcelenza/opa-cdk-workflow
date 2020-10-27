package http.api.authz

import input.attributes.request.http as http_request

default allow = false

allowed_paths = {"/", "/echo"}
allowed_methods = {"GET", "POST"}

allow {
    allowed_paths[http_request.path]
    allowed_methods[http_request.method]
}
