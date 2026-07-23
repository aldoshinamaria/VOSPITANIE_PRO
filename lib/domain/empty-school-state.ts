import { mockAppState } from "@/data/mock-data";
import { standardActivityDirections } from "@/lib/domain/activity-directions";
import { createWorkProgramAssembler } from "@/lib/domain/work-program/work-program-assembler";
import type { AppState } from "@/types/domain";

export function createEmptySchoolState(): AppState {
  const now = new Date().toISOString();
  const state: AppState = {
    ...mockAppState,
    schoolPassport: {
      id: "school-work",
      name: "",
      region: "",
      municipality: "",
      address: "",
      principal: "",
      deputyDirector: "",
      academicYear: "2026/2027",
      studentsCount: 0,
      classesCount: 0,
      infrastructure: {
        museum: false,
        mediaCenter: false,
        theater: false,
        sportsClub: false,
        volunteerTeam: false,
        yuid: false,
        firstMovement: false,
        eagletsOfRussia: false,
        childInitiativesCenter: false,
        schoolParliament: false,
        customItems: []
      },
      socialPartners: [],
      updatedAt: now
    },
    activityDirections: standardActivityDirections,
    eventDirectionRelations: [],
    eventExecutions: [],
    events: [],
    kpvr: [],
    extraActivities: [],
    educationalSystem: {
      associations: [],
      infrastructureObjects: [],
      partners: []
    },
    importedDocuments: [],
    extractedEvents: [],
    normativeDocuments: [],
    processedDocuments: [],
    documentProcessingLogs: [],
    complianceCheckHistory: [],
    exportDocuments: []
  };

  return {
    ...state,
    workProgram: createWorkProgramAssembler().assemble(state)
  };
}
