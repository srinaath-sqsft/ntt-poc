FROM python:3.8.0
RUN apt-get update && apt-get -y install vim

COPY requirements.txt /tmp/requirements.txt
COPY copy.py /etc/copy.py
COPY docker-entrypoint.sh /etc/docker-entrypoint.sh
RUN chmod +x /etc/docker-entrypoint.sh
RUN pip3 install -r /tmp/requirements.txt

ENTRYPOINT [ "/etc/docker-entrypoint.sh" ]
