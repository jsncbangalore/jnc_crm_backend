export declare class CreateProjectDto {
    name: string;
    description?: string;
    status?: string;
}
export declare class UpdateProjectDto {
    name?: string;
    description?: string;
    status?: string;
}
export declare class AssignMembersDto {
    memberIds: string[];
}
export declare class UploadLogDto {
    taskSummary?: string;
}
