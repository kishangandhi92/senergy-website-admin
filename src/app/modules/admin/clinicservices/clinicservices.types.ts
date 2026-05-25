export interface IClinicService {
    id: number;
    title: string;
    description: string;
    servicePhoto: string;
    createdAt?: string;
    modifiedAt?: string;
    disabled?: boolean
}
