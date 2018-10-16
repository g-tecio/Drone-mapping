FROM ubuntu:18.04 as builder

ADD ../../.ssh/id_rsa.pub /root/.ssh/id_rsa

RUN apt-get update
RUN apt-get -y install curl git
RUN apt-get install -my wget gnupg
RUN curl -sL https://deb.nodesource.com/setup_8.x | bash -
RUN apt-get install -y nodejs
RUN git clone git@github.com:g-tecio/Drone-mapping.git
RUN npm install -g @angular/cli
RUN cd /Drone-mapping \
    && npm install

FROM alpine
COPY --from=builder . .

ENTRYPOINT cd /Drone-mapping \
    && ng serve