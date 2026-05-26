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
