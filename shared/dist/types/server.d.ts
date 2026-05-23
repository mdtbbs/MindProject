export interface Server {
    id: number;
    name: string;
    owner_id: number;
    port: number;
    status: 'pending' | 'approved' | 'running' | 'stopped';
    version: string;
    container_id?: string;
    created_at: string;
}
//# sourceMappingURL=server.d.ts.map