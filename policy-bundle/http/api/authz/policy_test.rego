package http.api.authz

test_get_home_allowed {
    allow with input as {
        "attributes": {
            "request": {
                "http": {
                    "method": "GET",
                    "path": "/"
                }
            }
        }
    }
}

test_get_echo_allowed {
    allow with input as {
        "attributes": {
            "request": {
                "http": {
                    "method": "GET",
                    "path": "/echo"
                }
            }
        }
    }
}

test_post_home_denied {
    not allow with input as {
        "attributes": {
            "request": {
                "http": {
                    "method": "POST",
                    "path": "/"
                }
            }
        }
    }
}

test_post_echo_denied {
    not allow with input as {
        "attributes": {
            "request": {
                "http": {
                    "method": "POST",
                    "path": "/echo"
                }
            }
        }
    }
}

test_get_elsewhere_denied {
    not allow with input as {
        "attributes": {
            "request": {
                "http": {
                    "method": "GET",
                    "path": "/foo"
                }
            }
        }
    }
}