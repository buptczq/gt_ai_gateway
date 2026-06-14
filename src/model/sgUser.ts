import { Model } from "sutando";
import { inspect, InspectOptions } from "util";
import { UserType, UserStatus } from "../constants";

class SgUser extends Model {
    table = "user";

    id!: number;
    name!: string;
    token!: string;
    type!: UserType;
    balance!: number;
    status!: UserStatus;

    created_at!: Date;
    updated_at!: Date;

    [inspect.custom](depth: number, options: InspectOptions) {
        return JSON.stringify(this.toData(), null, 2);
    }
}

export { SgUser };
