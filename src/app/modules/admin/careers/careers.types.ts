export interface ICareer {
    id: number;
    title: string;
    experience: string;
    qualification: string;
    skills: string;
    isOpen: boolean;
    createdAt: string;
    modifiedAt: string;
}

export interface ICareerPayload {
    title: string;
    experience: string;
    qualification: string;
    skills: string;
    isOpen: boolean;
}
