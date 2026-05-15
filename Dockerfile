FROM node:20

RUN apt update && apt install -y \
    lua5.4 \
    git

WORKDIR /app

RUN git clone https://github.com/prometheus-lua/Prometheus.git

COPY . .

RUN npm install

CMD ["node", "index.js"]
