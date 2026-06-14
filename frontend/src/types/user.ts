import type { BaseEntity, TableQuery } from './index';

export type UserType = 'normal' | 'admin' | 'root';

export interface User extends BaseEntity {
    name: string;
    token: string;
    type: UserType;
    balance: number;
    status: 'active' | 'disabled';
}

export interface CreateUserRequest {
    name: string;
    token?: string;
    type?: UserType;
}

export interface UpdateUserRequest {
    name?: string;
    token?: string;
    status?: 'active' | 'disabled';
}

export interface UserQuery extends TableQuery {
    type?: UserType;
}

export interface AdjustBalanceRequest {
    amount: number;
    type: 'recharge' | 'adjustment';
    remark?: string;
}
