import { assertEquals } from "@std/assert";
import { http } from "@/http/index.ts";

function startHttpServer(){
    const app = http();

    app.use((_req, res, next) => {
      res.setHeader("X-Custom-Header", "test");
      next();
    })
    
    app.get("/", (_, res, next) => {
      res.send("hello world");
      next();
    });
    
    app.get("/", (_, res) => {
      res.send("hello world2");
    });
    
    app.get("/path", (_, res) => {
      res.json({path: "path"});
    });
    
    app.listen(8000);

    return app;
}

Deno.test("End-to-end test for http server", async (t) => {
  // setup
  const app = startHttpServer();
  const url = "http://localhost:8000";

  await t.step("Test main path", async () => {
     // action
    const response = await fetch(url);
    const actualRes = await response.text();

    // assert
    const actualHeader = response.headers.get("x-custom-header");
    assertEquals(actualHeader, "test");
    assertEquals(actualRes, "hello world2");
  });
  
  await t.step("Test path", async () => {
    // action
    const response = await fetch(url+"/path");
    const actualRes = await response.json();

    // assert
    const actualHeader = response.headers.get("x-custom-header");
    assertEquals(actualHeader, "test");
    assertEquals(actualRes.path, "path");
  });

  app.close();
});
