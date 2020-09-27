POLICY_STAGING_DIR=opa.out

.PHONY: clean policies deploy

clean:
	rm -rf $(POLICY_STAGING_DIR)

bundle:
	mkdir -p $(POLICY_STAGING_DIR)
	tar -C ./policy-bundle -czvf $(POLICY_STAGING_DIR)/bundle.tar.gz .

deploy: bundle
	cdk deploy