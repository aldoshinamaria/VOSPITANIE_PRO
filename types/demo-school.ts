export type DemoSchoolTemplateId =
  | "urban"
  | "rural"
  | "cadet"
  | "volunteer";

export interface DemoSchoolTemplate {
  id: DemoSchoolTemplateId;
  title: string;
  description: string;
}
