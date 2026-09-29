# Use a standard Node image (avoid Alpine for Prisma/SQLite on Raspberry Pi to prevent binary issues)
FROM node:22-bookworm-slim
WORKDIR /code

# Copy the entire project into the container
COPY . /code/.

# Install dependencies across root, frontend, and backend using your custom script
RUN npm run install:all

# (For Tomorrow) Generate Prisma Client once you add the database
# RUN npx prisma generate --schema=backend/prisma/schema.prisma

# Build the frontend into static files (outputs to /code/frontend/dist)
RUN npm run build --prefix frontend

# Compile the backend TypeScript into JavaScript (outputs to /code/backend/dist)
RUN npm run build --prefix backend

# Expose the port disco.json expects
EXPOSE 3000

# Run the compiled Express backend
CMD ["node", "backend/dist/server.js"]