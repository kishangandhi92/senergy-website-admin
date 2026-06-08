export interface Product {
    id: number;
    title: string;
    slug: string;
    short_description: string;
    image?: string;
    image_alt?: string;
    order?: number;
    details: string;
    seoData?: string;
    ctaData?: string;
    status: number;
    created_at?: string;
    updated_at?: string;
    disabled?: number
}
