# CA Summary Frontend - Dockerfile
FROM node:20-alpine AS base

# 依存関係インストール用ステージ
FROM base AS deps
WORKDIR /app

# 依存関係ファイルをコピー
COPY package.json ./
RUN npm install

# ビルド用ステージ
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 環境変数（ビルド時に設定可能）
ARG NEXT_PUBLIC_API_BASE=http://localhost:8000/api
ENV NEXT_PUBLIC_API_BASE=${NEXT_PUBLIC_API_BASE}

# public ディレクトリを作成（存在しない場合のため）
RUN mkdir -p public

# Next.js をビルド
RUN npm run build

# 本番実行用ステージ
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# 非rootユーザーでの実行（セキュリティ向上）
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# ビルド成果物をコピー
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# ヘルスチェック
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

CMD ["node", "server.js"]
