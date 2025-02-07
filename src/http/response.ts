import { HttpStatus } from "@/http/http.type.ts";

export class HttpResponse {
    httpVersion: string = "HTTP/1.1";
    httpStatus: HttpStatus = HttpStatus.OK;
    httpBody: string = "";
    httpHeaders: Map<string, string> = new Map();

    constructor(){
        this.httpHeaders.set("Content-Type", "text/html; charset=utf-8");
    }

    setHeader(key: string, value: string): HttpResponse{
        this.httpHeaders.set(key, value);
        return this;
    }

    private transferHeaders(httpHeaders: Map<string, string>): string {
        let headers = "";
        for(const [k, v] of httpHeaders){
            headers += `${k}: ${v}\r\n`;
        }
        headers += "\r\n";
        return headers;
    }

    status(status: HttpStatus): HttpResponse {
        this.httpStatus = status
        return this;
    }

    version(httpVersion: string): HttpResponse {
        this.httpVersion = httpVersion;
        return this;
    }

    json(body: unknown[] | Record<string, unknown>): HttpResponse {
        this.httpBody = JSON.stringify(body);
        this.setHeader("Content-Type", "application/json");
        return this;
    }

    send(body: string | number): HttpResponse {
        if(typeof body === "number"){
            this.httpBody = body.toString();
            return this;
        }

        this.httpBody = body;
        this.setHeader("Content-Type", "text/html; charset=utf-8");
        return this;
    }

    get(): Uint8Array {
        this.setHeader("Date", new Date().toUTCString());
        this.setHeader("Content-Length", new TextEncoder().encode(this.httpBody).length.toString());
        const headers = this.transferHeaders(this.httpHeaders);
        const res = 
            `${this.httpVersion} ${this.httpStatus}\r\n` +
            headers + 
            this.httpBody;

        return this.encode(res);
    }

    encode(text: string): Uint8Array {
        const encoder = new TextEncoder();
        const data = encoder.encode(text);
        return data;
    }
}

export class HttpError extends Error {
    status: HttpStatus;
    constructor(status: HttpStatus, message: string){
        super(message);
        this.status = status;
    }
}