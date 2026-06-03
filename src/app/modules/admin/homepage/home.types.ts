export interface IHeroBannerCta {
    label: string;
    link: string;
    style: 'primary' | 'secondary';
    target: '_self' | '_blank';
}

export interface IHeroBannerSection {
    priority: number;
    content: {
        title: string;
        subtitle: string;
    };
    image: {
        src: string;
        alt: string;
    };
    features: string[];
    cta: IHeroBannerCta[];
}

export interface IHeroBannerRecord {
    id?: string;
    pageId?: string;
    section: string;
    content: IHeroBannerSection[];
}

export interface IAdvantagesFeature {
    priority: number | null;
    alt: string;
    icon: string;
    title: string;
    description: string;
}

export interface IAdvantagesSection {
    title: string;
    subtitle: string;
    features: IAdvantagesFeature[];
}

export interface IAdvantagesRecord {
    id?: string;
    pageId?: string;
    section: string;
    content: IAdvantagesSection;
}

export interface IAboutImage {
    alt: string;
    src: string;
    type: 'main' | 'secondary';
}

export interface IAboutSection {
    title: string;
    description: string;
    knowMore: {
        label: string;
        link: string;
        target: '_self' | '_blank';
    };
    images: IAboutImage[];
}

export interface IAboutRecord {
    id?: string;
    pageId?: string;
    section: string;
    content: IAboutSection;
}

export interface IStatItem {
    count: string;
    title: string;
    description: string;
}

export interface IStatsRecord {
    id?: string;
    pageId?: string;
    section: string;
    content: IStatItem[];
}

export interface ICoreSolutionItem {
    priority: number | null;
    link: string;
    image: string;
    title: string;
    altText: string;
    description: string;
}

export interface ICoreSolutionsRecord {
    id?: string;
    pageId?: string;
    section: string;
    content: ICoreSolutionItem[];
}

export interface IClientItem {
    priority: number | null;
    name: string;
    image: string;
}

export interface IClientsRecord {
    id?: string;
    pageId?: string;
    section: string;
    content: IClientItem[];
}

export interface ITestimonialItem {
    priority: number | null;
    name: string;
    role: string;
    image: string;
    message: string;
}

export interface ITestimonialsRecord {
    id?: string;
    pageId?: string;
    section: string;
    content: ITestimonialItem[];
}

export interface IHome {
    bannerTitle: string;
    bannerSubtitle: string;
    bannerDescription: string;
    bannerImage: string;
    aboutUs: string;
    aboutImage: string;
    servicesTitle: string;
    servicesDescription: string;
    doctorImage: string;
    clinicImage: string;
    whyChooseUsTitle: string;
    whyChooseUsDescripton: string;
    whyChooseUsDoctors: string;
    whyChooseUsClinics: string;
}
