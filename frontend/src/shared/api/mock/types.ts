export interface AuthUserMock {
  id: string;
  email: string;
  user_metadata: {
    display_name?: string;
  };
}

export interface AuthSessionMock {
  access_token: string;
  user: AuthUserMock;
}
