# OPA CDK Workflow

This repository defines a simple application (API service) that uses Envoy and OPA to authorize traffic.

## Getting Started

Bootstrap the CDK:

```bash
cdk bootstrap
```

Deploy the stack:

```bash
make deploy
```

Using the DNS name output from the deploy step above, you should be able to assert that some requests succeed, while others fail:

```bash
curl -v http://<LB dns name>
< HTTP/1.1 200 OK
chirp

curl -d "hello" -v http://<LB dns name>/echo
< HTTP/1.1 403 Forbidden
```

As demonstrated above, the policy is configured by default to allo `GET` requests to `/`, but not `POST` requests to `/echo`. You can modify the policy in this repository to correct that.

## Policy Modification

First, add a new test to the `policy_test.rego` file to represent the new functionality you want to assert. Execute the test suite and notice the test fails:

```bash
make test
```

Now adjust the rules defined in `policy.rego` to make your test pass. When you're ready to deploy these changes, re-deploy:

```bash
make deploy
```

This will deploy the updated policy bundle, which the API service's OPA container will pick up within 20 seconds and begin enforcing. It will not redeploy the service.

Note: CDK will prompt with what appears to be an IAM policy modification for the task role associated with the API service. There is no actual change, other than the parameter name used in the CFN template. This is a known issue in CDK that is being addressed with [this work](https://github.com/aws/aws-cdk/issues/3463).

## Cleanup

Tear it all down:

```bash
make destroy
```