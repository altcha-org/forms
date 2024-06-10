FROM node:20 as base
WORKDIR /usr/src/app

FROM base AS install
RUN mkdir -p /temp/dev
COPY package*.json /temp/dev/
RUN cd /temp/dev && npm install

RUN mkdir -p /temp/prod
COPY package*.json /temp/prod/
RUN cd /temp/prod && npm install --omit=dev

FROM base AS prerelease
COPY --from=install /temp/dev/node_modules node_modules
COPY . .

ENV NODE_ENV=production
RUN npm run build

FROM base AS release
COPY --from=install /temp/prod/node_modules node_modules
COPY --from=prerelease /usr/src/app/build build
COPY --from=prerelease /usr/src/app/static static
COPY --from=prerelease /usr/src/app/templates templates
COPY --from=prerelease /usr/src/app/package.json .

RUN mkdir -p /usr/src/app/data

EXPOSE 3000/tcp
ENTRYPOINT [ "node", "build" ]