BASE_DIR=$(shell pwd)
POLICY_BUNDLE_DIR=$(BASE_DIR)/policy-bundle
POLICY_STAGING_DIR=$(BASE_DIR)/opa.out

.PHONY: clean test bundle deploy

clean:
	rm -rf $(POLICY_STAGING_DIR)

test:
	docker run -it -v $(POLICY_BUNDLE_DIR):/policies --rm openpolicyagent/opa:latest-envoy test /policies -v

bundle:
	mkdir -p $(POLICY_STAGING_DIR)
	tar -C $(POLICY_BUNDLE_DIR) -czvf $(POLICY_STAGING_DIR)/bundle.tar.gz .

deploy: test bundle
	cdk deploy