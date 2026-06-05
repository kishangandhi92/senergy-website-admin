export interface IAboutIntroButton {
    label: string;
    link: string;
    target: '_self' | '_blank';
}

export interface IAboutIntroSection {
    badge: string;
    content: {
        title: string;
        description: string;
    };
    button: IAboutIntroButton;
}

export interface IAboutIntroRecord {
    id?: string;
    pageId?: string;
    section: string;
    content: IAboutIntroSection;
}

export interface IMissionVisionItem {
    title: string;
    description: string;
}

export interface IMissionVisionSection {
    mission: IMissionVisionItem;
    vision: IMissionVisionItem;
}

export interface IMissionVisionRecord {
    id?: string;
    pageId?: string;
    section: string;
    content: IMissionVisionSection;
}

export interface ICoreExpertiseItem {
    priority: number | null;
    icon: string;
    title: string;
}

export interface ICoreExpertiseSection {
    title: string;
    expertise: ICoreExpertiseItem[];
}

export interface ICoreExpertiseRecord {
    id?: string;
    pageId?: string;
    section: string;
    content: ICoreExpertiseSection;
}
