import { 
    readBuf, 
    splitLines, 
    getMethodAndUrl, 
    getHeaders 
} from "@/http/reader.ts";
import { HttpResponse } from "@/http/response.ts";
import { HttpStatus, Request, RouteDefinition, Method, RouteHandler, MiddlewaresDefinition } from "@/http/http.type.ts";

type Path = string;

export class Http {
    routes: RouteDefinition[] = [];
    middlewares: MiddlewaresDefinition[] = [];
    
    use(callback: Path | RouteHandler, ...callbacks: RouteHandler[]): void {
        if(typeof callback === "string"){
            const path = callback;
            this.addMiddleware(path, ...callbacks)
            return;
        }

        this.addMiddleware("*", callback, ...callbacks)
    }

    get(path: Path, ...callbacks: RouteHandler[]){
        this.addRoute(Method.GET, path, callbacks);
    }

    post(path: Path, ...callbacks: RouteHandler[]){
        this.addRoute(Method.POST, path, callbacks);
    }

    put(path: Path, ...callbacks: RouteHandler[]) {
        this.addRoute(Method.PUT, path, callbacks);
    }

    patch(path: Path, ...callbacks: RouteHandler[]) {
        this.addRoute(Method.PATCH, path, callbacks);
    }

    delete(path: Path, ...callbacks: RouteHandler[]){
        this.addRoute(Method.DELETE, path, callbacks);
    }

    async listen(port: number) {
        const listener = Deno.listen({
            port,
            transport: "tcp"
        });
    
        for await (const conn of listener){
            this.handleConn(conn);
        }
    }

    private async handleConn(conn: Deno.Conn) {
        try{
            const text = await readBuf(conn);
            const lines = splitLines(text);
            
            const fl = lines[0];
            const { method, path, version } = getMethodAndUrl(fl);

            const headersStr = lines.slice(1, lines.length -1);
            const headers = getHeaders(headersStr);
            const request = { method, path, version, headers };

            const res = new HttpResponse();

            const allMiddleware = this.middlewares.find(m => m.path === "*");
            if(allMiddleware){
                this.runCallbacks(allMiddleware.callbacks, request, res);
            }

            const middleware = this.middlewares.find(m => m.path === path);
            if(middleware){
                this.runCallbacks(middleware.callbacks, request, res);
            }

            const route = this.routes.find(r => (r.path === path && r.method === method));
            if(!route) throw new Error("no define route or method");

            const routeCallbacks = route.callbacks;
            await this.runCallbacks(routeCallbacks, request, res);
            const response = res.get();

            await conn.write(response);
            conn.close();
        } catch(err){
            const res = new HttpResponse();
            const response = res.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                .send((err as Error).message)
                                .get();
    
            await conn.write(response);
            conn.close();
        }
    }

    private async runCallbacks(callbacks: RouteHandler[], req: Request, res: HttpResponse){
        let index = 0;
  
        async function next(): Promise<void> {
            if (index < callbacks.length) {
                const callback = callbacks[index++];
                await Promise.resolve(callback(req, res, next));
            }
        }
        
        await next();
    }

    private addRoute(method: Method, path: string, callbacks: RouteHandler[]){
        const route = this.routes.find(r => r.method === method && r.path === path);
        if(!route){
            this.routes.push({
                method,
                path,
                callbacks
            });
            return ;
        }

        route.callbacks.push(...callbacks);
    }

    private addMiddleware(path: string, ...callbacks: RouteHandler[]){
        const middleware = this.middlewares.find(m => (m.path === path));
        if(!middleware){
            this.middlewares.push({
                path,
                callbacks
            });
            return;
        }

        middleware.callbacks.push(...callbacks);
    }
}