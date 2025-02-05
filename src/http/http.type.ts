import { HttpResponse } from "@/http/response.ts";

export enum Method {
    GET = "GET",
    POST = "POST",
    PUT = "PUT",
    PATCH = "PATCH",
    DELETE = "DELETE",
}

//export type Method ="GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export enum HttpStatus {
    OK = "200 OK",
    CREATED = "201 Created",
    BAD_REQUEST = "400 Bad Request",
    UNAUTHORIZES = "401 Unauthorized",
    NOT_FOUND = "404 Not Found",
    INTERNAL_SERVER_ERROR = "500 Internal Server Error"
};

export type Request = {
    method: Method,
    path: string,
    version: string,
    headers: Record<string, string>
};

export type RouteHandler = (req: Request, res: HttpResponse, next: () => Promise<void>) => void;

export type RouteDefinition = {
    method: Method,
    path: string,
    callbacks: RouteHandler[]
}