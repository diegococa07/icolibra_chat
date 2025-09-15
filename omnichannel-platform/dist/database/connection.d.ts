import { Pool } from 'pg';
export declare const pool: Pool;
export declare const testConnection: () => Promise<boolean>;
export declare const query: (text: string, params?: any[]) => Promise<import("pg").QueryResult<any>>;
export declare const closePool: () => Promise<void>;
//# sourceMappingURL=connection.d.ts.map