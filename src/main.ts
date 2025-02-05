
import { http } from "@/http/index.ts";

const app = http();

app.get("/", (_, res) => {
  res.send("hello world");
});

app.listen(8001);