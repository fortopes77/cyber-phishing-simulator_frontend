FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build -- --configuration=production

FROM nginx:alpine
# Replace <project-name> with the name in angular.json / dist output folder
COPY --from=build /app/dist/phishing-frontend/browser /usr/share/nginx/html
EXPOSE 80