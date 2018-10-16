### STAGE 1: Build ###
# We label our stage as 'builder'
FROM node:9-alpine as builder

COPY package.json package-lock.json ./

RUN npm set progress=false && npm config set depth 0 && npm cache clean --force

## Storing node modules on a separate layer will prevent unnecessary npm installs at each build
RUN npm i && mkdir /drone-mapping && cp -R ./node_modules ./drone-mapping

WORKDIR /drone-mapping

COPY . .

## Build the angular app in production mode and store the artifacts in dist folder
RUN $(npm bin)/ng build --aot --prod --output-hashing none


### STAGE 2: Setup ###

FROM nginx:1.13.3-alpine

## Copy our default nginx config
COPY nginx.conf /etc/nginx/conf.d/

## Remove default nginx website
RUN rm -rf /usr/share/nginx/html/*

## From 'builder' stage copy over the artifacts in dist folder to default nginx public folder
COPY --from=builder /drone-mapping/dist /usr/share/nginx/html

CMD ["nginx", "-g", "daemon off;"]
