# Use a standard Node image (avoid Alpine for Prisma/SQLite on Raspberry Pi to prevent binary issues)
FROM node:22-bookworm-slim
WORKDIR /code

# Set the default runtime port to 3000 for Disco
ENV PORT=3000

# Copy the entire project into the container
COPY . /code/.

# Install python and build utilities to compile better-sqlite3 then remove
# Install dependencies across root, frontend, and backend using your custom script
# Build the frontend into static files (outputs to /code/frontend/dist)
# Compile the backend TypeScript into JavaScript (outputs to /code/backend/dist)
# Comment
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    && npm run install:all \
    && npm run build --prefix frontend \
    && npm run build --prefix backend \
    && apt-get purge -y --auto-remove python3 make g++ \
    && rm -rf /var/lib/apt-get/lists/*

# Expose the port disco.json expects
EXPOSE 3000

# Run the compiled Express backend
CMD ["node", "backend/dist/server.js"]