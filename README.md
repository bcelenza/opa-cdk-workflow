# OPA CDK Workflow

This repository defines a simple application (API service) that uses Envoy and OPA to authorize traffic.

## Getting Started

Bootstrap the project. This will install the AWS CDK and bootstrap the stack.

```bash
make bootstrap
```

Next, deploy the stack.

```bash
make deploy
```

The application being deployed in this example is a simple HTTP service that will respond to a request to `/echo` by replying with any data passed (via the request's `POST` body).

Using the DNS name output from the deploy step above, we should be able to assert that some requests succeed, while others fail.

```bash
curl -v http://<LB dns name>/echo
< HTTP/1.1 200 OK


curl -d "hello" -v http://<LB dns name>/echo
< HTTP/1.1 403 Forbidden
```

As shown above, the policy is configured to allow `GET` requests to `/echo`, but not `POST` requests to `/echo`. We can modify the policy in this repository to correct that.

## Policy Modification

In this case, we want to allow POST for the `/echo` path. Find this test:

```
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
```

And change it to:

```
test_post_echo_allowed {
    allow with input as {
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
```

Execute the test suite and notice the test fails:

```bash
make test
```

Now adjust the rules defined in `policy.rego` to make the test pass. When you're ready to deploy these changes, run deploy again.

```bash
make deploy
```

This will deploy the updated policy bundle, which the API service's OPA container will pick up within 20 seconds and begin enforcing. It will not redeploy the service.

The POST request to `/echo` should now work.

```
curl -d "hello" -v http://<LB dns name>/echo
< HTTP/1.1 200 OK
hello
```

## Cleanup

Tear it all down.

```bash
make destroy
```