import type { Meeting, Attendee, ActionItem } from './types';
import { PlaceHolderImages } from './placeholder-images';

export const attendees: Attendee[] = [
  { id: 'user-1', name: 'Alice Johnson', avatarUrl: PlaceHolderImages[0].imageUrl },
  { id: 'user-2', name: 'Bob Williams', avatarUrl: PlaceHolderImages[1].imageUrl },
  { id: 'user-3', name: 'Charlie Brown', avatarUrl: PlaceHolderImages[2].imageUrl },
  { id: 'user-4', name: 'Diana Miller', avatarUrl: PlaceHolderImages[3].imageUrl },
  { id: 'user-5', name: 'Eve Davis', avatarUrl: PlaceHolderImages[4].imageUrl },
];

export const actionItems: ActionItem[] = [
    {
        id: 'action-1',
        task: 'Finalize budget for Q3 marketing campaign.',
        assigneeId: 'user-1',
        dueDate: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString(),
        completed: false,
        meetingId: 'meeting-1',
        topicId: 'topic-1-1'
    },
    {
        id: 'action-2',
        task: 'Draft initial design mockups for the new homepage.',
        assigneeId: 'user-3',
        dueDate: new Date(new Date().setDate(new Date().getDate() + 10)).toISOString(),
        completed: false,
        meetingId: 'meeting-1',
        topicId: 'topic-1-2'
    },
    {
        id: 'action-3',
        task: 'Research and report on competitor API pricing.',
        assigneeId: 'user-2',
        dueDate: new Date(new Date().setDate(new Date().getDate() + 5)).toISOString(),
        completed: true,
        meetingId: 'meeting-2',
        topicId: 'topic-2-1'
    },
];

export const meetings: Meeting[] = [
  {
    id: 'meeting-1',
    title: 'Q3 Project Kickoff',
    date: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString(),
    description: 'Initial planning session for all major projects starting in Q3. Goal is to align on scope, resources, and timelines.',
    attendeeIds: ['user-1', 'user-2', 'user-3', 'user-4'],
    topics: [
      {
        id: 'topic-1-1',
        title: 'Marketing Campaign "Ignite"',
        discussionPoints: [
            {id: 'dp-1-1-1', text: 'Campaign budget needs to be finalized.'},
            {id: 'dp-1-1-2', text: 'Target audience is 18-25 year olds.'},
        ],
      },
      {
        id: 'topic-1-2',
        title: 'Website Redesign',
        discussionPoints: [
            {id: 'dp-1-2-1', text: 'Focus on mobile-first experience.'},
            {id: 'dp-1-2-2', text: 'New branding guidelines to be applied.'},
        ],
      },
    ],
  },
  {
    id: 'meeting-2',
    title: 'Weekly Tech Sync',
    date: new Date(new Date().setDate(new Date().getDate() - 2)).toISOString(),
    description: 'Sync-up on development progress, blockers, and next steps for the current sprint.',
    attendeeIds: ['user-2', 'user-3', 'user-5'],
    topics: [
      {
        id: 'topic-2-1',
        title: 'API Performance',
        discussionPoints: [
            {id: 'dp-2-1-1', text: 'Identified bottleneck in the authentication service.'},
            {id: 'dp-2-1-2', text: 'Competitor APIs are faster; need to investigate.'},
        ],
      },
       {
        id: 'topic-2-2',
        title: 'Database Migration',
        discussionPoints: [
            {id: 'dp-2-2-1', text: 'Migration script is 90% complete.'},
            {id: 'dp-2-2-2', text: 'Staging environment testing scheduled for Friday.'},
        ],
      },
    ],
  },
];
