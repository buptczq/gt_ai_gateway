import { describe, it, expect, beforeAll } from "vitest";
import requestHelper from "../../helpers/requestHelper";
import vendorFixtures from "../../fixtures/vendorFixtures";
import modelFixtures from "../../fixtures/modelFixtures";
import testHelpers from "../../testHelpers";

/**
 * Model Endpoint Positive Tests
 */

const adminToken = "admin-token-123";
let openaiVendorId: number;
let anthropicVendorId: number;
let createdModelId: number;

describe("Model API (Positive)", () => {
    beforeAll(async () => {
        await testHelpers.truncateDatabase();

        // Insert admin user
        const now = new Date().toISOString();
        testHelpers.execute(
            "INSERT INTO user (name, token, type, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
            ["Admin User", adminToken, "admin", now, now],
        );

        // Create vendors for model tests
        const openaiVendor = await requestHelper.post(
            "/vendor/create.json",
            vendorFixtures.VENDOR_FIXTURES.openai(),
            adminToken,
        );
        openaiVendorId = openaiVendor.body.id;

        const anthropicVendor = await requestHelper.post(
            "/vendor/create.json",
            vendorFixtures.VENDOR_FIXTURES.anthropic(),
            adminToken,
        );
        anthropicVendorId = anthropicVendor.body.id;
    });

    describe("POST /model/create.json", () => {
        it("should create a model linked to OpenAI vendor", async () => {
            const modelData = modelFixtures.createRandomModel(
                openaiVendorId,
                "gpt-3.5-turbo",
            );
            const response = await requestHelper.post(
                "/model/create.json",
                modelData,
                adminToken,
            );

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty("id");
            expect(response.body.name).toBe("gpt-3.5-turbo");
            expect(response.body.vendor_id).toBe(openaiVendorId);
            expect(response.body).toHaveProperty("created_at");
            expect(response.body).toHaveProperty("updated_at");
            expect(response.body).toHaveProperty("enable");
            expect(response.body.enable).toBe(true);

            createdModelId = response.body.id;
        });

        it("should create a model linked to Anthropic vendor", async () => {
            const modelData = modelFixtures.createRandomModel(
                anthropicVendorId,
                "claude-3-haiku-20240307",
            );
            const response = await requestHelper.post(
                "/model/create.json",
                modelData,
                adminToken,
            );

            expect(response.status).toBe(200);
            expect(response.body.name).toBe("claude-3-haiku-20240307");
            expect(response.body.vendor_id).toBe(anthropicVendorId);
        });

        it("should create a random model", async () => {
            const modelData = modelFixtures.createRandomModel(openaiVendorId);
            const response = await requestHelper.post(
                "/model/create.json",
                modelData,
                adminToken,
            );

            expect(response.status).toBe(200);
            expect(response.body.vendor_id).toBe(openaiVendorId);
            expect(response.body.name).toBeTruthy();
        });
    });

    describe("GET /model/list.json", () => {
        it("should return a list of models", async () => {
            const response = await requestHelper.get(
                "/model/list.json",
                adminToken,
            );

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBeGreaterThan(0);
        });

        it("should return models with correct structure", async () => {
            const response = await requestHelper.get(
                "/model/list.json",
                adminToken,
            );
            const model = response.body[0];

            expect(model).toHaveProperty("id");
            expect(model).toHaveProperty("name");
            expect(model).toHaveProperty("vendor_id");
            expect(model).toHaveProperty("created_at");
            expect(model).toHaveProperty("updated_at");
            expect(model).toHaveProperty("enable");
        });

        it("should include models from different vendors", async () => {
            const response = await requestHelper.get(
                "/model/list.json",
                adminToken,
            );

            const vendorIds = response.body.map((m: any) => m.vendor_id);
            expect(vendorIds).toContain(openaiVendorId);
            expect(vendorIds).toContain(anthropicVendorId);
        });
    });

    describe("Model Enable/Disable", () => {
        let disabledModelId: number;
        let enabledModelId: number;

        it("should create a disabled model", async () => {
            const modelData = modelFixtures.createRandomModel(openaiVendorId);
            modelData.enable = false;
            const response = await requestHelper.post(
                "/model/create.json",
                modelData,
                adminToken,
            );

            expect(response.status).toBe(200);
            expect(response.body.enable).toBe(false);
            disabledModelId = response.body.id;
        });

        it("should find enabled model in list", async () => {
            const response = await requestHelper.get(
                "/model/list.json",
                adminToken,
            );
            const disabledModel = response.body.find((m: any) => m.id === disabledModelId);
            expect(disabledModel.enable).toBe(0);
        });

        it("should create an enabled model by default", async () => {
            const modelData = modelFixtures.createRandomModel(openaiVendorId);
            // 不传 enable 字段
            delete modelData.enable;
            const response = await requestHelper.post(
                "/model/create.json",
                modelData,
                adminToken,
            );

            expect(response.status).toBe(200);
            expect(response.body.enable).toBe(true);
            enabledModelId = response.body.id;
        });

        it("should create an explicitly enabled model", async () => {
            const modelData = modelFixtures.createRandomModel(openaiVendorId);
            modelData.enable = true;
            const response = await requestHelper.post(
                "/model/create.json",
                modelData,
                adminToken,
            );

            expect(response.status).toBe(200);
            expect(response.body.enable).toBe(true);
        });
    });
});