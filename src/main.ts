import { http } from "@/http/index.ts";

const app = http();

app.use((req, res, next) => {
  console.log("use");
});

app.get("/", (_, res, next) => {
  res.send("hello world");
  next();
});

app.get("/", (_, res) => {
  res.send("hello world2");
});

app.get("/path", (_, res) => {
  res.send("path");
});

app.listen(8000);
