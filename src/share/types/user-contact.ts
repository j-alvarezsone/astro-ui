export interface UserContact {
  id: string;
  name: string;
  email: string;
}

export interface GetAllUserResponse {
  items: UserContact[];
}

export interface CreateUserBody {
  name: string;
  email: string;
}

export interface CreateUserResponse {
  item: UserContact;
}
