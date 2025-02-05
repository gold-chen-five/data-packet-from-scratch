import { assertEquals } from "@std/assert";
import { HttpResponse } from "@/http/response.ts";
import { HttpStatus } from "@/http/http.type.ts";

Deno.test("Test HttpResponse", () => {
    const tests= [
        {
            status: HttpStatus.OK,
            version: "HTTP/1.1",
            body: "test",
        },
        {
            status: HttpStatus.OK,
            version: "HTTP/1.2",
            body: {hello: "world"},
        }
    ];
    const expects = [
        {
            status: HttpStatus.OK,
            version: "HTTP/1.1",
            body: "test",
            contentType: "text/html; charset=utf-8" 
        },
        {
            status: HttpStatus.OK,
            version: "HTTP/1.2",
            body: JSON.stringify({hello: "world"}),
            contentType: "application/json" 
        }
    ];

    // act
    for(const [index, value] of tests.entries()){
        const res = new HttpResponse();
        let actualResponse: HttpResponse;
        if(index === 0){
            actualResponse = res
                                .status(value.status)
                                .version(value.version)
                                .send(value.body as string);  
        }else {
            actualResponse = res
                                .status(value.status)
                                .version(value.version)
                                .json(value.body as { hello: string });  
        }

        assertEquals(actualResponse.httpStatus, expects[index].status);
        assertEquals(actualResponse.httpContentType, expects[index].contentType);
        assertEquals(actualResponse.httpBody, expects[index].body);
        assertEquals(actualResponse.httpVersion, expects[index].version);
    }
});