export interface PetContact {
  id: string;
  name: string;
  type: 'dog' | 'cat' | 'bird';
}

export interface GetAllPetsResponse {
  items: PetContact[];
}

export interface CreatePetBody {
  name: string;
  type: 'dog' | 'cat' | 'bird';
}

export interface CreatePetResponse {
  item: PetContact;
}
