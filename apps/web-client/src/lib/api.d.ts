/**
 * API Client Configuration
 */
export declare const apiClient: import("axios").AxiosInstance;
export declare const api: {
    auth: {
        verify: (credential: string) => Promise<import("axios").AxiosResponse<any, any, {}>>;
        me: () => Promise<import("axios").AxiosResponse<any, any, {}>>;
        watermark: () => Promise<import("axios").AxiosResponse<any, any, {}>>;
        logout: () => Promise<void>;
    };
    subjects: {
        list: (yearLevel?: number) => Promise<import("axios").AxiosResponse<any, any, {}>>;
        get: (id: string) => Promise<import("axios").AxiosResponse<any, any, {}>>;
    };
    calendar: {
        list: (params?: {
            start_date?: string;
            end_date?: string;
            type?: string;
        }) => Promise<import("axios").AxiosResponse<any, any, {}>>;
        getMonth: (year: number, month: number) => Promise<import("axios").AxiosResponse<any, any, {}>>;
        upcoming: (limit?: number) => Promise<import("axios").AxiosResponse<any, any, {}>>;
    };
    profile: {
        get: (id: string) => Promise<import("axios").AxiosResponse<any, any, {}>>;
        update: (id: string, data: Record<string, unknown>) => Promise<import("axios").AxiosResponse<any, any, {}>>;
    };
};
//# sourceMappingURL=api.d.ts.map