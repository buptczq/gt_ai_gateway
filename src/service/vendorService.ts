import { SgVendor } from "../model/sgVendor";
import { ApiFormat } from "../constants";


async function getVendorByName(name: string): Promise<SgVendor | null> {
    if (name == null) {
        return null;
    }

    return await SgVendor.query().where("name", name).first();
}


async function updateVendor(
    vendorId: number,
    data: { type?: string; name?: string; token?: string; url?: string; api_format?: string },
): Promise<SgVendor | null> {
    const vendor = await SgVendor.query().find(vendorId);

    if (!vendor) {
        return null;
    }

    // Validate api_format if provided
    if (data.api_format !== undefined) {
        const validFormats = Object.values(ApiFormat);
        if (!validFormats.includes(data.api_format)) {
            throw new Error("Invalid api_format");
        }
    }

    await SgVendor.query()
        .where("id", vendorId)
        .update({
            type: data.type ?? vendor.type,
            name: data.name ?? vendor.name,
            token: data.token ?? vendor.token,
            url: data.url ?? vendor.url,
            api_format: data.api_format ?? vendor.api_format,
        });

    return await SgVendor.query().find(vendorId);
}

export default {
    getVendorByName,
    updateVendor,
};
