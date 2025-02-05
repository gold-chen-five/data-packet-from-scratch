import { 
    readBuf, 
    splitLines, 
    getMethodAndUrl, 
    getHeaders 
} from "@/http/reader.ts";
import { HttpResponse } from "@/http/response.ts";
import { HttpStatus, Request, RouteDefinition, Method, RouteHandler } from "@/http/http.type.ts";

export class Http {
    routes: RouteDefinition[] = [];

    use(){
        
    }

    get(path: string, ...callbacks: RouteHandler[]){
        this.routes.push({
            method: Method.GET,
            path,
            callbacks: callbacks
        });
    }

    post(path: string, ...callbacks: RouteHandler[]){
        this.routes.push({
            method: Method.POST,
            path,
            callbacks: callbacks
        });
    }

    put(path: string, ...callbacks: RouteHandler[]) {
        this.routes.push({
            method: Method.PUT,
            path,
            callbacks: callbacks
        });
    }

    patch(path: string, ...callbacks: RouteHandler[]) {
        this.routes.push({
            method: Method.PATCH,
            path,
            callbacks: callbacks
        });
    }

    delete(path: string, ...callbacks: RouteHandler[]){
        this.routes.push({
            method: Method.DELETE,
            path,
            callbacks: callbacks
        });
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

            const callbacks = this.findMatchRoute(path, method);

            const res = new HttpResponse();

            await this.runCallbacks(callbacks, request, res);
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

    private findMatchRoute(path: string, method: Method){
        const findRoute = this.routes.find(route => (route.path === path && route.method === method));
        if(!findRoute)  throw new Error("no define route or method");
        return findRoute.callbacks;
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
}