FROM shopify/toxiproxy:2.1.4
COPY config/ /go/bin/
RUN ["chmod", "+x", "/go/bin/start.sh"]



EXPOSE 8474
WORKDIR /go/bin

ENTRYPOINT ["/go/bin/start.sh"]
CMD ["-host=0.0.0.0"]