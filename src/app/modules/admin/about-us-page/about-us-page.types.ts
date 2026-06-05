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
