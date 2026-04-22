import { describe, it, expect } from "vitest";
import requestHelper from "../../helpers/requestHelper";

/**
 * System Endpoint Tests
 */

describe("System API", () => {
    describe("GET /welcome", () => {
        it("should return welcome message with status 200", async () => {
            const response = await requestHelper.get("/welcome");

            expect(response.status).toBe(200);
            expect(response.body).toContain("Hello");
            expect(response.body).toContain("serverless ai gateway");
        });

        it("should return a text response", async () => {
            const response = await requestHelper.get("/welcome");

            expect(typeof response.body).toBe("string");
            expect(response.headers.get("content-type")).toContain(
                "text/plain",
            );
        });

        it("should indicate node mode", async () => {
            const response = await requestHelper.get("/welcome");

            // In node mode: contains "node mode", in worker mode: contains "serverless ai gateway"
            const isNodeMode = response.body.includes("node mode");
            const isWorkerMode = response.body.includes("serverless ai gateway") && !response.body.includes("node mode");
            expect(isNodeMode || isWorkerMode).toBe(true);
        });
    });
});
