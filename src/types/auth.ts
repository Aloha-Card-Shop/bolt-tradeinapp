
export interface UserMetadata {
  role: 'admin' | 'manager' | 'user';
}

export interface User {
  id: string;
  email: string;
  user_metadata: UserMetadata;
}

export interface Session {
  user: User;
}
