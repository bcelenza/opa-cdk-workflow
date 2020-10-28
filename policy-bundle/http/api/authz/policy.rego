package http.api.authz

import input.attributes.request.http as http_request

default allow = false

allowed_paths = {"/", "/echo"}

allow {
    allowed_paths[http_request.path]
    http_request.method == "GET"
}

allow {
    http_request.path == "/echo"
    http_request.method == "POST"
}
