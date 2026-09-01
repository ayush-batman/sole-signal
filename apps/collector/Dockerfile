FROM apify/actor-node:22
COPY package.json ./
RUN corepack enable && pnpm install --prod --no-frozen-lockfile
COPY . ./
CMD ["pnpm", "start"]
