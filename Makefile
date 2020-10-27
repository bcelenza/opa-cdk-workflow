BASE_DIR=$(shell pwd)
POLICY_BUNDLE_DIR=$(BASE_DIR)/policy-bundle
POLICY_STAGING_DIR=$(BASE_DIR)/opa.out
OPA_IMAGE=openpolicyagent/opa:latest-envoy
CDK_BIN=$(BASE_DIR)/node_modules/.bin/cdk

.PHONY: clean test bundle deploy

clean:
	rm -rf $(POLICY_STAGING_DIR)

test:
	docker run --rm \
		-v $(POLICY_BUNDLE_DIR):/policies \
		$(OPA_IMAGE) test -v /policies

bundle:
	mkdir -p $(POLICY_STAGING_DIR)
	docker run --rm \
		-v $(POLICY_BUNDLE_DIR):/policies \
		-v $(POLICY_STAGING_DIR):/output \
		$(OPA_IMAGE) build -o /output/bundle.tar.gz -b /policies

deploy: test bundle
	$(CDK_BIN) deploy --require-approval never

destroy: clean
	$(CDK_BIN) destroy