export type UserRole = 'guest' | 'user' | 'moderator' | 'admin';
export interface User {
    id: number;
    username: string | null;
    email: string | null;
    role: UserRole;
    avatar_url?: string | null;
    bio?: string | null;
    mindauth_id?: number;
    created_at?: string;
}
//# sourceMappingURL=user.d.ts.map