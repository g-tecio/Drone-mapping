FROM ubuntu:16.04 as builder

RUN apt-get update
RUN apt-get -y install curl git
RUN curl -sL https://deb.nodesource.com/setup_8.x | bash -
RUN apt-get install -y nodejs
RUN git clone https://USERNAME:PASSWORD@github.com/g-tecio/Drone-mapping.git
RUN npm install -g @angular/cli
RUN cd /Drone-mapping \
    && npm install

FROM alpine
COPY --from=builder . .

ENTRYPOINT cd /Drone-mapping \
    && ng serve --host 0.0.0.0 --port 4200