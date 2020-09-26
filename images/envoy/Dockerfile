FROM envoyproxy/envoy:v1.12-latest

ADD envoy.yaml /tmp/envoy.yaml
ENTRYPOINT ["envoy", "-l", "debug", "-c", "/tmp/envoy.yaml"]