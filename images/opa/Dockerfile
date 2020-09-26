FROM openpolicyagent/opa:latest-envoy
ADD config /tmp/config
CMD ["run", "--server", "--log-level=debug", "--config-file=/tmp/config/config.yaml"]