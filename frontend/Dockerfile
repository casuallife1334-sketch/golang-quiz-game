FROM node:24-bookworm AS builder

WORKDIR /app

ARG BUILD_ID=dev
ENV VITE_BUILD_ID=${BUILD_ID}

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

FROM nginx:1.29-alpine

COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
