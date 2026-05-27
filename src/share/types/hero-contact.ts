export interface HeroContact {
  id: string;
  name: string;
  power: string;
}

export interface GetAllHeroesResponse {
  items: HeroContact[];
}

export interface CreateHeroBody {
  name: string;
  power: string;
}

export interface CreateHeroResponse {
  item: HeroContact;
}
