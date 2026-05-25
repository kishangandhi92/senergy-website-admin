export interface Product {
    autoNo: number;
    name: string;
    localeTitle: string;
    description: string;
    photo: string;
    createdAt?: string;
    lastModifiedAt?: string;
    disabled?: boolean
    priority?: number
}
