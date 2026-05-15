FROM node:20

# Instalar Lua y herramientas necesarias
RUN apt update && apt install -y \
    lua5.4 \
    liblua5.4-dev \
    git \
    && rm -rf /var/lib/apt/lists/*

# Verificar instalación de Lua
RUN lua5.4 -v

WORKDIR /app

# Clonar Prometheus
RUN git clone https://github.com/prometheus-lua/Prometheus.git

# Verificar que el CLI existe
RUN ls -la /app/Prometheus/

# Copiar archivos del bot
COPY package*.json ./
RUN npm install

COPY . .

# Crear directorios necesarios
RUN mkdir -p temp output

EXPOSE 8080

CMD ["node", "index.js"]