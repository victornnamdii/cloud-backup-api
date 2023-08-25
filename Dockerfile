FROM node:18

WORKDIR /app

COPY package*.json ./

RUN npm install


COPY . .

RUN npm run test

EXPOSE 5000
CMD [ "cat", ".env", "|", "npm", "start" ]