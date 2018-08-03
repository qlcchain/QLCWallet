FROM tiangolo/node-frontend:10 as builder

# install chrome for protractor tests
# RUN wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add -
# RUN sh -c 'echo "deb [arch=amd64] https://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list'
# RUN apt-get update && apt-get install -yq google-chrome-stable

WORKDIR /usr/src/app

# add `/usr/src/app/node_modules/.bin` to $PATH
ENV PATH /usr/src/app/node_modules/.bin:$PATH

COPY . /usr/src/app
# COPY package.json /usr/src/app/package.json
RUN npm i -g npm && npm i -g @angular/cli \
        && npm i @angular/cli \
        && npm i --unsafe-perm -V && ng lint && npm run wallet:build

##################
### production ###
##################

# base image
FROM nginx:1.13.9-alpine

# copy artifact build from the 'build environment'
COPY --from=builder /usr/src/app/dist /usr/share/nginx/html
COPY --from=builder /nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]