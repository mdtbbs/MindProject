export interface User {
  id: number;
  username: string;
  email: string;
  role: 'user' | 'moderator' | 'admin';
  avatar_url?: string;
  bio?: string;
  mindauth_id?: string;
  created_at?: string;
}