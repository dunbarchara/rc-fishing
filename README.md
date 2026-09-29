Repo bootstrapping details in `BOILERPLATE.md`

My current versions:
```bash
node -v # 25.2.1
npm -v # 11.6.2
docker -v # 29.7.2
```

To run locally:
```bash
# From repo root
npm run dev
# http://localhost:3000/
```

To run as Docker image:
```bash
# From repo root
docker build . --tag rc-fishing
docker run -p 3000:3000 -e PORT=3000 rc-fishing
# http://localhost:3000/
```
