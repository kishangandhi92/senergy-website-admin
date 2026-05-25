/* eslint-disable */
import { FuseNavigationItem } from '@fuse/components/navigation';
import { NAV_MENU_ID } from 'app/constants/navigation';

export const defaultNavigation: FuseNavigationItem[] = [
     {
        id   : 'dashboard',
        title: 'Dashboard',
        type : 'basic',
        icon : 'mat_outline:dashboard',
        link : '/dashboard'
    },
    {
        id   : 'general-enquiries',
        title: 'General Enquiries',
        type : 'basic',
        icon : 'heroicons_outline:bell',
        link : '/enquiries/general'
    },
    {
        id: 'configurations',
        title: 'Configurations',
        type: 'group',
        icon: 'heroicons_outline:home',
        children: [
            {
                id: 'configurations.slider',
                title: 'Hero Slider',
                type: 'basic',
                icon: 'mat_outline:slideshow',
                link: '/configurations/slider',
            },
            {
                id: 'configurations.home',
                title: 'Home Page',
                type: 'basic',
                icon: 'heroicons_outline:home',
                link: '/configurations/home',
            },
            {
                id: 'configurations.services',
                title: 'Services',
                type: 'basic',
                icon: 'mat_outline:settings',
                link: '/configurations/services',
            },
            {
                id: 'configurations.about',
                title: 'About Page',
                type: 'basic',
                icon: 'mat_outline:info',
                link: '/configurations/about',
            },
            {
                id: 'configurations.privacy',
                title: 'Privacy Policy',
                type: 'basic',
                icon: 'mat_outline:lock',
                link: '/configurations/privacy',
            },
            {
                id: 'configurations.contact',
                title: 'Contact Details',
                type: 'basic',
                icon: 'mat_outline:contact_phone',
                link: '/configurations/contact',
            }
        ],
    }

];
export const compactNavigation: FuseNavigationItem[] = [
    {
        id   : 'example',
        title: 'Example',
        type : 'basic',
        icon : 'heroicons_outline:chart-pie',
        link : '/example'
    }
];
export const futuristicNavigation: FuseNavigationItem[] = [
    {
        id   : 'example',
        title: 'Example',
        type : 'basic',
        icon : 'heroicons_outline:chart-pie',
        link : '/example'
    }
];
export const horizontalNavigation: FuseNavigationItem[] = [
    {
        id   : 'example',
        title: 'Example',
        type : 'basic',
        icon : 'heroicons_outline:chart-pie',
        link : '/example'
    }
];
