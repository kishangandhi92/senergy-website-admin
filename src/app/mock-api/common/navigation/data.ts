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
            // {
            //     id: 'configurations.slider',
            //     title: 'Hero Slider',
            //     type: 'basic',
            //     icon: 'mat_outline:slideshow',
            //     link: '/configurations/slider',
            // },
            {
                id: 'configurations.home',
                title: 'Home Page',
                type: 'collapsable',
                icon: 'heroicons_outline:home',
                children: [
                    {
                        id: 'configurations.home.hero-banner',
                        title: 'Hero Banner',
                        type: 'basic',
                        icon: 'mat_outline:photo',
                        link: '/configurations/home/hero-banner',
                    },
                    {
                        id: 'configurations.home.advantages',
                        title: 'Advantages',
                        type: 'basic',
                        icon: 'mat_outline:star',
                        link: '/configurations/home/advantages',
                    },
                    {
                        id: 'configurations.home.about',
                        title: 'About',
                        type: 'basic',
                        icon: 'heroicons_outline:information-circle',
                        link: '/configurations/home/about',
                    },
                    {
                        id: 'configurations.home.stats',
                        title: 'Stats',
                        type: 'basic',
                        icon: 'mat_outline:bar_chart',
                        link: '/configurations/home/stats',
                    },
                    {
                        id: 'configurations.home.core-solutions',
                        title: 'Core Solutions',
                        type: 'basic',
                        icon: 'mat_outline:widgets',
                        link: '/configurations/home/core-solutions',
                    },
                    {
                        id: 'configurations.home.clients',
                        title: 'Clients',
                        type: 'basic',
                        icon: 'mat_outline:groups',
                        link: '/configurations/home/clients',
                    },
                    {
                        id: 'configurations.home.testimonials',
                        title: 'Testimonials',
                        type: 'basic',
                        icon: 'heroicons_outline:chat-bubble-left-right',
                        link: '/configurations/home/testimonials',
                    },
                    {
                        id: 'configurations.home.cta',
                        title: 'CTA',
                        type: 'basic',
                        icon: 'mat_outline:ads_click',
                        link: '/configurations/home/cta',
                    },
                ],
            },
            {
                id: 'configurations.about-us-page',
                title: 'About Us Page',
                type: 'collapsable',
                icon: 'heroicons_outline:information-circle',
                children: [
                    {
                        id: 'configurations.about-us-page.about-intro',
                        title: 'About Intro',
                        type: 'basic',
                        icon: 'mat_outline:subject',
                        link: '/configurations/about-us-page/about-intro',
                    },
                    {
                        id: 'configurations.about-us-page.mission-and-vision',
                        title: 'Mission and Vision',
                        type: 'basic',
                        icon: 'mat_outline:flag',
                        link: '/configurations/about-us-page/mission-and-vision',
                    },
                    {
                        id: 'configurations.about-us-page.team-gallery',
                        title: 'Team Gallery',
                        type: 'basic',
                        icon: 'mat_outline:photo_library',
                        link: '/configurations/about-us-page/team-gallery',
                    },
                    {
                        id: 'configurations.about-us-page.core-expertise',
                        title: 'Core Expertise',
                        type: 'basic',
                        icon: 'mat_outline:star',
                        link: '/configurations/about-us-page/core-expertise',
                    },
                    {
                        id: 'configurations.about-us-page.cta',
                        title: 'CTA',
                        type: 'basic',
                        icon: 'mat_outline:ads_click',
                        link: '/configurations/about-us-page/cta',
                    },
                ],
            },
            {
                id: 'configurations.careers',
                title: 'Careers Page',
                type: 'basic',
                icon: 'mat_outline:work',
                link: '/configurations/careers',
            },
            {
                id: 'configurations.contact',
                title: 'Contact Page',
                type: 'basic',
                icon: 'mat_outline:contact_phone',
                link: '/configurations/contact',
            }
            // {
            //     id: 'configurations.about',
            //     title: 'About Page',
            //     type: 'basic',
            //     icon: 'mat_outline:info',
            //     link: '/configurations/about',
            // },
            // {
            //     id: 'configurations.privacy',
            //     title: 'Privacy Policy',
            //     type: 'basic',
            //     icon: 'mat_outline:lock',
            //     link: '/configurations/privacy',
            // },
            
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
