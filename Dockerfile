FROM node:20-alpine AS builder

WORKDIR /app

ARG TIPTAP_PRO_TOKEN
ARG NEXT_PUBLIC_API_BASE_URL="https://app.lawvriksh.com/"
ARG NEXT_PUBLIC_WS_URL_GRAMMER_SPELL="https://app.lawvriksh.com/api/ai/ws/spell-grammer/check"
ARG NEXT_PUBLIC_TASK_WS_URL="wss://app.lawvriksh.com/api/ws/tasks"

ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}
ENV NEXT_PUBLIC_WS_URL_GRAMMER_SPELL=${NEXT_PUBLIC_WS_URL_GRAMMER_SPELL}
ENV NEXT_PUBLIC_TASK_WS_URL=${NEXT_PUBLIC_TASK_WS_URL}

# Copy only dependency files first (better cache)
COPY package*.json ./

# 🔐 Configure Tiptap Pro registry dynamically
RUN echo "@tiptap-pro:registry=https://registry.tiptap.dev/" > .npmrc \
 && echo "//registry.tiptap.dev/:_authToken=${TIPTAP_PRO_TOKEN}" >> .npmrc \
 && npm install --legacy-peer-deps \
 && rm -f .npmrc

# Copy rest of the application
COPY . .

RUN npm run build


FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.ts ./

RUN chown -R nextjs:nodejs /app

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]





# run the following command to build the docker image and push to AWS ECR
#aws ecr get-login-password --region ap-south-1 | docker login --username AWS --password-stdin 331005568033.dkr.ecr.ap-south-1.amazonaws.com
# docker build --platform linux/arm64 \
#     --build-arg NEXT_PUBLIC_API_BASE_URL="https://app.lawvriksh.com/" \
#     --build-arg NEXT_PUBLIC_WS_URL_GRAMMER_SPELL="https://app.lawvriksh.com/api/ai/ws/spell-grammer/check" \
#     --build-arg NEXT_PUBLIC_TASK_WS_URL="wss://app.lawvriksh.com/api/ws/tasks" \
#     -t frontend:dev .
#docker tag frontend:dev 331005568033.dkr.ecr.ap-south-1.amazonaws.com/lawvriksh/frontend:latest
#docker push 331005568033.dkr.ecr.ap-south-1.amazonaws.com/lawvriksh/frontend:latest

#docker run -p 8000:8000 --name frontend_container frontend:dev