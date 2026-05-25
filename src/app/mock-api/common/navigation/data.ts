/* eslint-disable */
import { FuseNavigationItem } from '@fuse/components/navigation';

export const defaultNavigation: FuseNavigationItem[] = [
    {
        id: 'dashboard',
        title: 'Dashboard',
        type: 'basic',
        icon: 'mat_outline:dashboard',
        link: '/dashboard',
    },
    {
        id: 'configurations.home',
        title: 'Home Page',
        type: 'group',
        children: [
            {
                id: 'configurations.home.hero',
                title: 'Hero Video',
                type: 'basic',
                icon: 'mat_outline:ondemand_video',
                link: '/configurations/home/hero',
            },
            {
                id: 'configurations.home.about',
                title: 'Quick About Us',
                type: 'basic',
                icon: 'mat_outline:info',
                link: '/configurations/home/about',
            },
            {
                id: 'configurations.home.features',
                title: 'Features',
                type: 'basic',
                icon: 'mat_outline:star',
                link: '/configurations/home/features',
            },
            {
                id: 'configurations.home.statistics',
                title: 'Statistics',
                type: 'basic',
                icon: 'mat_outline:bar_chart',
                link: '/configurations/home/statistics',
            },
            {
                id: 'configurations.home.gallery',
                title: 'Gallery',
                type: 'basic',
                icon: 'mat_outline:photo_library',
                link: '/configurations/home/gallery',
            },
            {
                id: 'configurations.home.location',
                title: 'Prime Location',
                type: 'basic',
                icon: 'mat_outline:map',
                link: '/configurations/home/location',
            },
        ],
    },
    {
        id: 'configurations.about',
        title: 'About Page',
        type: 'group',
        children: [
            {
                id: 'configurations.about.page-banner',
                title: 'Page Banner',
                type: 'basic',
                icon: 'heroicons_outline:bars-3-bottom-left',
                link: '/configurations/about/page-banner',
            },
            {
                id: 'configurations.about.who-we-are',
                title: 'Who We Are',
                type: 'basic',
                icon: 'mat_outline:people',
                link: '/configurations/about/who-we-are',
            },
            {
                id: 'configurations.about.our-vision',
                title: 'Our Vision',
                type: 'basic',
                icon: 'mat_outline:visibility',
                link: '/configurations/about/our-vision',
            },
            {
                id: 'configurations.about.oksan',
                title: 'About OKSAN',
                type: 'basic',
                icon: 'heroicons_outline:building-office-2',
                link: '/configurations/about/oksan',
            }
        ],
    },
    {
        id: 'configurations.masterplan',
        title: 'Master Plan',
        type: 'group',
        children: [
            {
                id: 'configurations.masterplan.page-banner',
                title: 'Page Banner',
                type: 'basic',
                icon: 'heroicons_outline:bars-3-bottom-left',
                link: '/configurations/masterplan/page-banner',
            },
            {
                id: 'configurations.masterplan.plan-details',
                title: 'Plan Details',
                type: 'basic',
                icon: 'mat_outline:design_services',
                link: '/configurations/masterplan/plan-details',
            },
            {
                id: 'configurations.masterplan.walkability',
                title: 'Walkability',
                type: 'basic',
                icon: 'mat_outline:directions_walk',
                link: '/configurations/masterplan/walkability',
            },
        ]
    },
    {
        id: 'configurations.residential',
        title: 'Residential',
        type: 'group',
        children: [
            {
                id: 'configurations.residential.page-banner',
                title: 'Page Banner',
                type: 'basic',
                icon: 'heroicons_outline:bars-3-bottom-left',
                link: '/configurations/residential/page-banner',
            },
            {
                id: 'configurations.residential.units',
                title: 'Units',
                type: 'basic',
                icon: 'mat_outline:bed',
                link: '/configurations/residential/units',
            }
        ]
    },
    {
        id: 'configurations.lifestyle',
        title: 'Lifestyle & Amenities',
        type: 'group',
        children: [
            {
                id: 'configurations.lifestyle.page-banner',
                title: 'Page Banner',
                type: 'basic',
                icon: 'heroicons_outline:bars-3-bottom-left',
                link: '/configurations/lifestyle/page-banner',
            },
            {
                id: 'configurations.lifestyle.amenities',
                title: 'Amenities',
                type: 'basic',
                icon: 'mat_outline:deck',
                link: '/configurations/lifestyle/amenities',
            }
        ]
    },
    {
        id: 'configurations.investments',
        title: 'Investments & Returns',
        type: 'group',
        children: [
            {
                id: 'configurations.investments.page-banner',
                title: 'Page Banner',
                type: 'basic',
                icon: 'heroicons_outline:bars-3-bottom-left',
                link: '/configurations/investments/page-banner',
            },
            {
                id: 'configurations.investments.revenue',
                title: 'Net Revenue',
                type: 'basic',
                icon: 'mat_outline:euro',
                link: '/configurations/investments/revenue',
            }
        ]
    },
    {
        id: 'configurations.360-walkthrough',
        title: '360 Walkthrough',
        type: 'group',
        children: [
            {
                id: 'configurations.360-walkthrough.page-banner',
                title: 'Page Banner',
                type: 'basic',
                icon: 'heroicons_outline:bars-3-bottom-left',
                link: '/configurations/360-walkthrough/page-banner',
            },
            {
                id: 'configurations.360-walkthrough.planner',
                title: 'Planner 5D',
                type: 'basic',
                icon: 'mat_outline:360',
                link: '/configurations/360-walkthrough/planner',
            }
        ]
    },
    {
        id: 'configurations.general',
        title: 'General',
        type: 'group',
        children: [
            {
                id: 'configurations.general.terms-conditions',
                title: 'Terms & Conditions',
                type: 'basic',
                icon: 'heroicons_outline:document-text',
                link: '/configurations/general/terms-conditions',
            },
            {
                id: 'configurations.general.privacy-policy',
                title: 'Privacy Policy',
                type: 'basic',
                icon: 'mat_outline:privacy_tip',
                link: '/configurations/general/privacy-policy',
            }
        ]
    }
];
export const compactNavigation: FuseNavigationItem[] = [
    {
        id: 'example',
        title: 'Example',
        type: 'basic',
        icon: 'heroicons_outline:chart-pie',
        link: '/example',
    },
];
export const futuristicNavigation: FuseNavigationItem[] = [
    {
        id: 'example',
        title: 'Example',
        type: 'basic',
        icon: 'heroicons_outline:chart-pie',
        link: '/example',
    },
];
export const horizontalNavigation: FuseNavigationItem[] = [
    {
        id: 'example',
        title: 'Example',
        type: 'basic',
        icon: 'heroicons_outline:chart-pie',
        link: '/example',
    },
];
