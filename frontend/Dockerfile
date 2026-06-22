FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json /app/
RUN npm ci

COPY . /app

ARG VITE_API_BASE_URL=http://localhost:8000/api
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

RUN npm run build

FROM node:20-alpine AS runtime

WORKDIR /app
RUN npm install -g serve

COPY --from=build /app/dist /app/dist

EXPOSE 4173

CMD ["sh", "-c", "serve -s dist -l ${PORT:-4173}"]
