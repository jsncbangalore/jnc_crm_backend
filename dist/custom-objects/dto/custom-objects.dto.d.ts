export declare class CreateCustomObjectDto {
    apiName: string;
    label: string;
    pluralLabel?: string;
    description?: string;
}
export declare class UpdateCustomObjectDto {
    label?: string;
    pluralLabel?: string;
    description?: string;
}
export declare class CreateCustomFieldDto {
    apiName: string;
    label: string;
    fieldType: string;
    isRequired?: boolean;
    isUnique?: boolean;
    picklistValues?: string[] | string;
    lookupTargetObject?: string;
    displayOrder?: number;
}
export declare class UpdateCustomFieldDto {
    label?: string;
    fieldType?: string;
    isRequired?: boolean;
    isUnique?: boolean;
    picklistValues?: string[] | string;
    lookupTargetObject?: string;
    displayOrder?: number;
}
