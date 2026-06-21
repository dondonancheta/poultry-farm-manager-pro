# PoultryFarm Pro — Angular Client (multi-stage)
# Build context: repo root

FROM node:22-alpine AS builder
WORKDIR /app
COPY client/package.json client/.npmrc ./
RUN npm install
COPY client/ .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist/poultry-farm-pro/browser /usr/share/nginx/html
COPY infrastructure/client/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
