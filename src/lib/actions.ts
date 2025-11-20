'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { meetings, attendees, actionItems } from './mock-data';
import type { Meeting, Attendee, ActionItem, Topic, DiscussionPoint } from './types';
import { generateMeetingSummary } from '@/ai/flows/automated-meeting-summary';
import { extractActionItems } from '@/ai/flows/extract-structured-action-items';
import { transcribeMeetingAudio } from '@/ai/flows/transcribe-meeting-audio';


// Data access functions
export async function getMeetings() {
  return meetings;
}

export async function getMeetingById(id: string) {
  return meetings.find((m) => m.id === id);
}

export async function getAttendees() {
  return attendees;
}

export async function getAttendeeById(id: string) {
  return attendees.find(a => a.id === id);
}

export async function getActionItemsForMeeting(meetingId: string) {
    return actionItems.filter(item => item.meetingId === meetingId);
}


// Form schemas
const MeetingSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters.'),
  description: z.string().min(10, 'Description must be at least 10 characters.'),
  date: z.string(),
  attendeeIds: z.preprocess((val) => {
    if (typeof val === 'string') return [val];
    return val;
  }, z.array(z.string()).min(1, 'At least one attendee is required.')),
});

const TopicSchema = z.object({
  meetingId: z.string(),
  title: z.string().min(3, 'Topic title must be at least 3 characters.'),
});

const PointSchema = z.object({
  meetingId: z.string(),
  topicId: z.string(),
  text: z.string().min(5, 'Discussion point must be at least 5 characters.'),
});

const ActionItemSchema = z.object({
    meetingId: z.string(),
    topicId: z.string(),
    task: z.string().min(5, 'Task must be at least 5 characters.'),
    assigneeId: z.string(),
    dueDate: z.string(),
});


// Server Actions
export async function createMeeting(prevState: any, formData: FormData) {
  const validatedFields = MeetingSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Failed to create meeting.',
    };
  }

  try {
    const { title, description, date, attendeeIds } = validatedFields.data;
    const newMeeting: Meeting = {
      id: `meeting-${Date.now()}`,
      title,
      description,
      date,
      attendeeIds,
      topics: [],
    };
    meetings.unshift(newMeeting);
    revalidatePath('/');
    revalidatePath('/meetings/new');
    return { message: 'success', meetingId: newMeeting.id };
  } catch (e) {
    return { message: 'Failed to create meeting.' };
  }
}

export async function addTopic(prevState: any, formData: FormData) {
    const validatedFields = TopicSchema.safeParse(Object.fromEntries(formData.entries()));

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Failed to add topic.',
        };
    }
    const { meetingId, title } = validatedFields.data;
    const meeting = meetings.find(m => m.id === meetingId);

    if (meeting) {
        const newTopic: Topic = {
            id: `topic-${Date.now()}`,
            title,
            discussionPoints: [],
        };
        meeting.topics.push(newTopic);
        revalidatePath(`/meetings/${meetingId}`);
        return { message: 'Topic added successfully.' };
    }
    return { message: 'Meeting not found.' };
}

export async function addDiscussionPoint(prevState: any, formData: FormData) {
    const validatedFields = PointSchema.safeParse(Object.fromEntries(formData.entries()));

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Failed to add point.',
        };
    }

    const { meetingId, topicId, text } = validatedFields.data;
    const meeting = meetings.find(m => m.id === meetingId);
    if(meeting) {
        const topic = meeting.topics.find(t => t.id === topicId);
        if (topic) {
            const newPoint: DiscussionPoint = {
                id: `dp-${Date.now()}`,
                text,
            };
            topic.discussionPoints.push(newPoint);
            revalidatePath(`/meetings/${meetingId}`);
            return { message: 'Point added successfully.' };
        }
        return { message: 'Topic not found.' };
    }
    return { message: 'Meeting not found.' };
}

export async function addActionItem(prevState: any, formData: FormData) {
    const validatedFields = ActionItemSchema.safeParse(Object.fromEntries(formData.entries()));

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Failed to add action item.',
        };
    }

    const { meetingId, topicId, task, assigneeId, dueDate } = validatedFields.data;

    const newActionItem: ActionItem = {
        id: `action-${Date.now()}`,
        meetingId,
        topicId,
        task,
        assigneeId,
        dueDate,
        completed: false
    };
    actionItems.push(newActionItem);
    revalidatePath(`/meetings/${meetingId}`);
    return { message: 'Action item added successfully.' };
}

export async function toggleActionItemComplete(id: string, meetingId: string) {
    const item = actionItems.find(i => i.id === id);
    if (item) {
        item.completed = !item.completed;
        revalidatePath(`/meetings/${meetingId}`);
    }
}

// AI Feature Actions
export async function runGenerateSummary(meetingId: string) {
  const meeting = await getMeetingById(meetingId);
  if (!meeting) throw new Error('Meeting not found');

  const meetingAttendees = meeting.attendeeIds.map(id => attendees.find(a => a.id === id)?.name).filter(Boolean);

  const transcript = `
    Meeting: ${meeting.title}
    Date: ${new Date(meeting.date).toLocaleDateString()}
    Attendees: ${meetingAttendees.join(', ')}
    Description: ${meeting.description}
    ---
    Topics:
    ${meeting.topics.map(topic => `
      Topic: ${topic.title}
      Discussion Points:
      ${topic.discussionPoints.map(p => `- ${p.text}`).join('\n')}
    `).join('\n\n')}
  `;

  try {
    const result = await generateMeetingSummary({ transcript });
    meeting.summary = result.summary;
    revalidatePath(`/meetings/${meetingId}`);
    return result.summary;
  } catch (error) {
    console.error('AI summary generation failed:', error);
    return 'Failed to generate summary.';
  }
}


export async function runExtractActionItems(meetingId: string) {
  const meeting = await getMeetingById(meetingId);
  if (!meeting) throw new Error('Meeting not found');
  
  const meetingText = `
    ${meeting.description}
    ${meeting.topics.map(topic => `
      ${topic.title}:
      ${topic.discussionPoints.map(p => p.text).join('. ')}
    `).join('\n')}
  `;
  
  try {
    const result = await extractActionItems({ meetingText });
    meeting.extractedActionItems = result;
    revalidatePath(`/meetings/${meetingId}`);
    return result;
  } catch (error) {
    console.error('AI action item extraction failed:', error);
    return [];
  }
}

export async function runTranscribeAudio(meetingId: string, audioDataUri: string) {
  const meeting = await getMeetingById(meetingId);
  if (!meeting) throw new Error('Meeting not found');
  
  try {
    const result = await transcribeMeetingAudio({ audioDataUri });
    meeting.transcription = result.transcription;
    revalidatePath(`/meetings/${meetingId}`);
    return result.transcription;
  } catch (error) {
    console.error('AI transcription failed:', error);
    return 'Failed to transcribe audio.';
  }
}
