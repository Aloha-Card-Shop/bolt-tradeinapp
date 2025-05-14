
export interface UserMetadata {
  role: 'admin' | 'manager' | 'user' | 'shopify_manager';
}

export interface User {
  id: string;
  email: string;
  user_metadata: UserMetadata;
}

export interface Session {
  user: User;
}
