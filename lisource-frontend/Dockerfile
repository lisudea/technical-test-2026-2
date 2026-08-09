FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ARG VITE_API_URL=http://localhost:8080/api/v1
ARG VITE_DATA_MODE=api
ARG VITE_GOOGLE_CLIENT_ID=
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_DATA_MODE=$VITE_DATA_MODE
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID
RUN npm run build

FROM node:22-alpine AS runtime
RUN addgroup -S lisource && adduser -S lisource -G lisource
WORKDIR /app
COPY --from=build --chown=lisource:lisource /app/dist ./dist
USER lisource
EXPOSE 3000
ENV PORT=3000
ENV HOST=0.0.0.0
CMD ["node", "dist/server/index.mjs"]
