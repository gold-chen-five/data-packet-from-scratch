
import { http } from "@/http/index.ts";

const app = http();

app.use((req,res,next) => {
  console.log("use");
  next();
})

app.get("/", (_, res) => {
  console.log("main")
  res.send("hello world");
});

app.listen(8000);