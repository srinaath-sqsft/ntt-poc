FROM docker.elastic.co/sa/data-shifter:8.0.1
#ecommerce analytics
RUN mkdir -p /opt/ecommerce-analytics/
RUN curl -s -f https://storage.googleapis.com/eden-files/appsearch-ecommerce/ecommerce-analytics-v3.json -o /opt/ecommerce-analytics/ecommerce.json || exit 1
#ecommerce logs
RUN mkdir -p /opt/ecommerce-logs/
RUN curl -s -f https://storage.googleapis.com/eden-files/appsearch-ecommerce/ecommerce-api-v2.json -o /opt/ecommerce-logs/ecommerce.json || exit 1
#kb analytics
RUN mkdir -p /opt/ecommerce-kb-analytics/
RUN curl -s -f https://storage.googleapis.com/eden-files/appsearch-ecommerce/ecommerce-analytics-kb.json -o /opt/ecommerce-kb-analytics/kb.json || exit 1
#kb logs
RUN mkdir -p /opt/ecommerce-kb-logs/
RUN curl -s -f https://storage.googleapis.com/eden-files/appsearch-ecommerce/ecommerce-api-kb.json -o /opt/ecommerce-kb-logs/kb.json || exit 1

COPY custom-entrypoint.sh /etc/custom-entrypoint.sh
WORKDIR /etc
RUN chmod +x /etc/custom-entrypoint.sh
RUN apt-get update --allow-releaseinfo-change
RUN apt-get install -y jq
ENTRYPOINT [ "/etc/custom-entrypoint.sh" ]