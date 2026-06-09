export type EducationalAssociationType =
  | "volunteer_team"
  | "school_museum"
  | "theater"
  | "media_center"
  | "yuid"
  | "yunarmiya"
  | "eaglets_of_russia"
  | "first_movement"
  | "sports_club"
  | "custom";

export type EducationalSystemStatus = "active" | "inactive";

export type InfrastructureObjectType =
  | "museum"
  | "media_center"
  | "assembly_hall"
  | "gym"
  | "library"
  | "child_initiatives_center"
  | "museum_room"
  | "subject_classrooms";

export interface EducationalAssociation {
  id: string;
  type: EducationalAssociationType;
  title: string;
  description: string;
  leader: string;
  participantsCount: number;
  classes: string;
  photoUrl: string;
  status: EducationalSystemStatus;
}

export interface SchoolInfrastructureObject {
  id: string;
  type: InfrastructureObjectType;
  title: string;
  description: string;
  responsible: string;
}

export interface EducationalSystemPartner {
  id: string;
  title: string;
  type: string;
  cooperationDescription: string;
  contactPerson: string;
}

export interface EducationalSystem {
  associations: EducationalAssociation[];
  infrastructureObjects: SchoolInfrastructureObject[];
  partners: EducationalSystemPartner[];
}
