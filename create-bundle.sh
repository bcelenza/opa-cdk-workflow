#!/bin/bash
set -e 

STAGING_DIR=opa.out

mkdir -p $STAGING_DIR
tar -C ./policy-bundle -czvf $STAGING_DIR/bundle.tar.gz .