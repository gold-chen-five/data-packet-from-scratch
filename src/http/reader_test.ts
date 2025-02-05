import { assertEquals } from "@std/assert";
import { getHeaders, checkMethod } from "@/http/reader.ts";

Deno.test("test getHeaders", () => {
    const lines = [
        "accept-encoding: gzip, deflate, br",
        "Accept: */*",
        "User-Agent: Thunder Client (https://www.thunderclient.com)",
        "Host: localhost:8000",
        "Connection: close",
        ""
    ];
    const expectValue: Record<string, string> = {
        "accept-encoding": "gzip, deflate, br",
        "Accept": "*/*",
        "User-Agent": "Thunder Client (https://www.thunderclient.com)",
        "Host": "localhost:8000",
        "Connection": "close",
    };

    const headers = getHeaders(lines);
    
    for(const key of Object.keys(headers)){
        assertEquals(headers[key], expectValue[key]);
    }
});

Deno.test("test is Method", () => {
    const isMethod = checkMethod("get");
    const isMethod2 = checkMethod("GET");
    
    assertEquals(isMethod, false);
    assertEquals(isMethod2, true);
})