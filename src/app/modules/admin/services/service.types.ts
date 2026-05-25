export interface Service {
    id: number;
    name: string;
    photo: string;
    oneliner: string;
    description?: string;
    createdAt?: string;
    lastModifiedAt?: string;
    disabled?: boolean
}
