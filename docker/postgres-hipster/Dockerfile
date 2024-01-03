FROM docker.elastic.co/sa/unified-ecom-postgres-catalogue:7.12.0-37
COPY ./postgresql.conf /etc/postgresql/postgresql.conf
COPY init.sql /docker-entrypoint-initdb.d/