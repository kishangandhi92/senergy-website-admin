/* eslint-disable */
import { DateTime } from 'luxon';

/* Get the current instant */
const now = DateTime.now();

export const activities = [
    {
        id: '493190c9-5b61-4912-afe5-78c21f1044d7',
        icon: 'heroicons_solid:lock-open',
        description: 'Logged in',
        date: now.minus({ minutes: 2 }).toISO(), // 25 minutes ago
        // extraContent: `<div class="font-bold">Congratulations for your acceptance!</div><br>
        //                 <div>Hi Brian,<br>Your submission has been accepted and you are ready to move into the next phase. Once you are ready, reach out to me and we will ...</div>`,
    },
    {
        id: '6e3e97e5-effc-4fb7-b730-52a151f0b641',
        icon: 'heroicons_solid:lock-closed',
        description:
            'Logged out',
        date: now.minus({ minutes: 50 }).toISO(), // 50 minutes ago
    },
    {
        id: 'b91ccb58-b06c-413b-b389-87010e03a120',
        icon: 'heroicons_solid:document-check',
        description: 'Data Entry done for <strong> Shift 2 </strong>',
        date: now.minus({ hours: 3 }).toISO(), // 3 hours ago
    },
    {
        id: '541416c9-84a7-408a-8d74-27a43c38d797',
        icon: 'heroicons_solid:document-check',
        description: 'Data Entry done for <strong> Shift 1 </strong>',
        date: now.minus({ hours: 5 }).toISO(), // 5 hours ago
    },
    // {
    //     id: 'ef7b95a7-8e8b-4616-9619-130d9533add9',
    //     image: 'images/avatars/male-06.jpg',
    //     description:
    //         '<strong>Roger Murray</strong> accepted your friend request',
    //     date: now.minus({ hours: 7 }).toISO(), // 7 hours ago
    //     extraContent: `You have <span class="font-semibold">8</span> mutual friends.`,
    // },
    // {
    //     id: 'eb8aa470-635e-461d-88e1-23d9ea2a5665',
    //     image: 'images/avatars/female-04.jpg',
    //     description: '<strong>Sophie Stone</strong> sent you a direct message',
    //     date: now.minus({ hours: 9 }).toISO(), // 9 hours ago
    // },
    {
        id: 'b85c2338-cc98-4140-bbf8-c226ce4e395e',
        icon: 'heroicons_solid:plus-circle',
        description: 'Added a new operator <strong>Sanjay Sharma </strong>',
        date: now.minus({ day: 1 }).toISO(), // 1 day ago
        // extraContent: `<ol class="list-decimal list-inside space-y-2">
        //                     <li class="font-medium">Please review and sign the attached agreement</li>
        //                     <li class="font-medium">Delivery address confirmation</li>
        //                     <li class="font-medium">Previous clients and their invoices</li>
        //                 </ol>`,
        // linkedContent: 'Mailbox',
        // link: '/apps/mailbox',
        // useRouter: true,
    },
    {
        id: 'fd0f01b4-f3de-4333-add5-cd86850279f8',
        icon: 'heroicons_solid:pencil',
        description: 'Updated an instrument <strong>GM Tube</strong>',
        date: now.minus({ day: 1 }).toISO(), // 1 day ago,
        // linkedContent: 'Go to Chat (Tina Harris)',
        // link: '/apps/chat/5636c0ba-fa47-42ca-9160-27340583041e',
        // useRouter: true,
    },
    {
        id: '8f8e1bf9-4661-4939-9e43-390957b60f42',
        icon: 'heroicons_solid:circle-stack',
        description: 'Performed Database Backup',
        date: now.minus({ days: 3 }).toISO(), // 3 days ago
    },
    // {
    //     id: '30af917b-7a6a-45d1-822f-9e7ad7f8bf69',
    //     icon: 'heroicons_solid:circle-stack',
    //     description: 'Your performed Database Backup operation',
    //     date: now.minus({ day: 4 }).toISO(), // 4 days ago
    // },
];
