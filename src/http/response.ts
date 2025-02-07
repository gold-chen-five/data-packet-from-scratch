import { HttpStatus } from "@/http/http.type.ts";

export class HttpResponse {
    httpVersion: string = "HTTP/1.1";
    httpStatus: HttpStatus = HttpStatus.OK;
    httpBody: string = "";
    httpContentType: string = "text/html; charset=utf-8"

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
        this.httpContentType = "application/json";
        return this;
    }

    send(body: string | number): HttpResponse {
        if(typeof body === "number"){
            this.httpBody = body.toString();
            return this;
        }

        this.httpBody = body;
        this.httpContentType = "text/html; charset=utf-8";
        return this;
    }

    get(): Uint8Array {
        const res = 
            `${this.httpVersion} ${this.httpStatus}\r\n` +
            `Content-Type: ${this.httpContentType}\r\n` + 
            `Date: ${new Date().toUTCString()}\r\n` + 
            `Content-Length: ${new TextEncoder().encode(this.httpBody).length}\r\n` +
            "\r\n" +
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