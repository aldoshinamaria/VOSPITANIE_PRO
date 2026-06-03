export interface SchoolPassport {
  id: string;
  name: string;
  region: string;
  municipality: string;
  address: string;
  principal: string;
  deputyDirector: string;
  academicYear: string;
  studentsCount: number;
  classesCount: number;
  infrastructure: SchoolInfrastructure;
  socialPartners: SocialPartner[];
  updatedAt: string;
}

export interface SchoolInfrastructure {
  museum: boolean;
  mediaCenter: boolean;
  theater: boolean;
  sportsClub: boolean;
  volunteerTeam: boolean;
  yuid: boolean;
  firstMovement: boolean;
  eagletsOfRussia: boolean;
  childInitiativesCenter: boolean;
  schoolParliament: boolean;
}

export interface SocialPartner {
  id: string;
  name: string;
  type: string;
  activity: string;
}
