# 第一阶段：构建应用
FROM node:20-alpine AS app-builder

# 设置工作目录
WORKDIR /app

# 复制package.json和package-lock.json
COPY package*.json ./
COPY tsconfig.json ./
COPY tsoa.json ./
COPY .npmrc ./

# 安装所有依赖（包括开发依赖）
RUN npm i
# 不是重复代码，不知道为什么要执行两遍npm i才正常
RUN npm i

# 复制源代码
COPY src/ ./src/

# 构建应用
RUN npm run build:tsoa && npm run build

#第二阶段：构建前端代码
FROM node:20-alpine AS app-front-builder

RUN apk add git

# 设置工作目录
WORKDIR /app

RUN git clone --depth 1 https://github.com/ai-learning-assistant-dev/ai-learning-assistant-training-front.git

WORKDIR /app/ai-learning-assistant-training-front

# 安装所有依赖（包括开发依赖）
RUN npm i pnpm -g

RUN pnpm i

RUN npm run build

# 第三阶段：最终镜像
FROM postgres:17-alpine

# 安装Node.js运行时
RUN apk add --no-cache nodejs npm curl

# 设置工作目录
WORKDIR /app

COPY --from=app-builder /app/node_modules ./node_modules
COPY --from=app-builder /app/dist ./dist
COPY --from=app-builder /app/package.json ./

# 复制环境配置文件
COPY .env ./
# 复制前端代码
COPY --from=app-front-builder /app/ai-learning-assistant-training-front/dist ./public

# 创建数据库初始化脚本目录
RUN mkdir -p /docker-entrypoint-initdb.d
COPY container-script/ai_learning_assistant.sql /docker-entrypoint-initdb.d/

# 创建备份目录
RUN mkdir -p /var/lib/postgresql/ala-backup
# 将数据库备份恢复脚本复制到容器中
COPY container-script /app/container-script

# 暴露端口
EXPOSE 3000

# 设置环境变量
ENV NODE_ENV=production
ENV POSTGRES_PASSWORD=KLNb923u4_odfh89

# 健康检查
HEALTHCHECK --interval=3s --timeout=1s --start-period=10s --retries=10 \
  CMD pg_isready -U postgres && curl -f http://127.0.0.1:3000/health || exit 1

# 启动命令 - 同时启动PostgreSQL和应用
CMD ["sh", "-c", "/app/container-script/restore.sh ; docker-entrypoint.sh postgres & sleep 10 && node dist/src/app.js"]
