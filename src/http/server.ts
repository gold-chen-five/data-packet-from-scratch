import {
  getHeaders,
  getMethodAndUrl,
  readBuf,
  splitLines,
} from "@/http/reader.ts";
import { HttpError, HttpResponse } from "@/http/response.ts";
import {
  HttpStatus,
  Method,
  MiddlewaresDefinition,
  Request,
  RouteDefinition,
  RouteHandler,
} from "@/http/http.type.ts";

type Path = string;

export class Http {
  listener: Deno.TcpListener | undefined = undefined;
  routes: RouteDefinition[] = [];
  middlewares: MiddlewaresDefinition[] = [];

  use(callback: Path | RouteHandler, ...callbacks: RouteHandler[]): void {
    if (typeof callback === "string") {
      const path = callback;
      this.addMiddleware(path, ...callbacks);
      return;
    }

    this.addMiddleware("*", callback, ...callbacks);
  }

  get(path: Path, ...callbacks: RouteHandler[]) {
    this.addRoute(Method.GET, path, callbacks);
  }

  post(path: Path, ...callbacks: RouteHandler[]) {
    this.addRoute(Method.POST, path, callbacks);
  }

  put(path: Path, ...callbacks: RouteHandler[]) {
    this.addRoute(Method.PUT, path, callbacks);
  }

  patch(path: Path, ...callbacks: RouteHandler[]) {
    this.addRoute(Method.PATCH, path, callbacks);
  }

  delete(path: Path, ...callbacks: RouteHandler[]) {
    this.addRoute(Method.DELETE, path, callbacks);
  }

  close() {
    if (!this.listener) return;
    this.listener.close();
  }

  async listen(port: number) {
    this.listener = Deno.listen({
      port,
      transport: "tcp",
    });

    for await (const conn of this.listener) {
      this.handleConn(conn);
    }
  }

  private async handleConn(conn: Deno.Conn) {
    try {
      const text = await readBuf(conn);
      const lines = splitLines(text);

      const fl = lines[0];
      const { method, path, version } = getMethodAndUrl(fl);

      const headersStr = lines.slice(1, lines.length - 1);
      const headers = getHeaders(headersStr);
      const request = { method, path, version, headers };

      const res = new HttpResponse();

      const allMiddleware = this.middlewares.find((m) => m.path === "*");
      if (allMiddleware) {
        this.runCallbacks(allMiddleware.callbacks, request, res);
      }

      const middleware = this.middlewares.find((m) => m.path === path);
      if (middleware) {
        this.runCallbacks(middleware.callbacks, request, res);
      }

      const route = this.routes.find(
        (r) => (r.path === path && r.method === method),
      );
      if (!route) {
        throw new HttpError(HttpStatus.NOT_FOUND, "no define route or method");
      }

      const routeCallbacks = route.callbacks;
      await this.runCallbacks(routeCallbacks, request, res);
      const response = res.get();

      await conn.write(response);
      conn.close();
    } catch (err) {
      const { status, message } = err as HttpError;
      const res = new HttpResponse();
      const response = res.status(status)
        .send(message)
        .get();

      await conn.write(response);
      conn.close();
    }
  }

  private async runCallbacks(
    callbacks: RouteHandler[],
    req: Request,
    res: HttpResponse,
  ) {
    let index = 0;

    async function next(): Promise<void> {
      if (index < callbacks.length) {
        const callback = callbacks[index++];
        await Promise.resolve(callback(req, res, next));
      }
    }

    await next();
  }

  private addRoute(method: Method, path: string, callbacks: RouteHandler[]) {
    const route = this.routes.find((r) =>
      r.method === method && r.path === path
    );
    if (!route) {
      this.routes.push({
        method,
        path,
        callbacks,
      });
      return;
    }

    route.callbacks.push(...callbacks);
  }

  private addMiddleware(path: string, ...callbacks: RouteHandler[]) {
    const middleware = this.middlewares.find((m) => (m.path === path));
    if (!middleware) {
      this.middlewares.push({
        path,
        callbacks,
      });
      return;
    }

    middleware.callbacks.push(...callbacks);
  }
}
