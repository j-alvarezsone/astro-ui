export interface UserContact {
  id: string;
  name: string;
  email: string;
}

export interface GetAllUserResponse {
  items: UserContact[];
}
