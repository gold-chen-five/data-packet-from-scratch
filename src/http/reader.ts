import { Method } from "@/http/http.type.ts";

export async function readBuf(conn: Deno.Conn): Promise<string> {
    const decoder = new TextDecoder();
    let result = "";
    const buf = new Uint8Array(1024);

    while(true) {
        const n = await conn.read(buf);
        if (n === null) break;

        result += decoder.decode(buf);
        if(n < buf.length) break;
    }

    return result; 
}

export function splitLines(text: string): string[] {
    const lines = text.split("\r\n");
    if(lines.length < 1 ) throw new Error("http packet is empty");
    return lines;
}

// first line: GET / HTTP/1.1
export function getMethodAndUrl(line: string): { method: Method, path: string, version: string } {
    const arr = line.split(" ");
    if(arr.length < 3) throw new Error("method, path, version is missing.");
    if(!checkMethod(arr[0])) throw new Error("method is invalid.");
    
    return { method: arr[0] as Method, path: arr[1], version: arr[2] };
}

export function checkMethod(method: string): method is Method {
    return Object.values(Method).includes(method as Method);
}

export function getHeaders(lines: string[]): Record<string, string> {
    const headers: Record<string, string> = {};

    for(const line of lines) {
        const larr = line.split(": ");
        if(larr.length < 2) continue;
        const key = larr[0];
        const value = larr[1];
        headers[key] = value;
    }
    return headers;
}

export function encode(text: string): Uint8Array {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    return data;
}