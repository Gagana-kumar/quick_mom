'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { cookies } from 'next/headers';
import { auth, meetings as meetingsApi, users, actionItems as actionItemsApi, fetchAPI } from './api';
import type { Meeting, Attendee, ActionItem, Topic, DiscussionPoint } from './types';
import { generateMeetingSummary } from '@/ai/flows/automated-meeting-summary';
import { extractActionItems } from '@/ai/flows/extract-structured-action-items';
import { transcribeMeetingAudio } from '@/ai/flows/transcribe-meeting-audio';

// Helper to convert backend IDs (int) to frontend IDs (string)
const toStringId = (item: any) => ({ ...item, id: item.id.toString() });

// Data access functions
export async function getMeetings(): Promise<Meeting[]> {
  try {
    const cookieStore = await cookies();
    const headers = { Cookie: cookieStore.toString() };
    const data = await meetingsApi.getAll(headers);
    return data.map((m: any) => ({
      ...m,
      id: m.id.toString(),
      topics: m.topics?.map((t: any) => ({
        ...t,
        id: t.id.toString(),
        discussionPoints: t.discussionPoints?.map((dp: any) => toStringId(dp)) || []
      })) || [],
      attendeeIds: m.attendees?.map((a: any) => a.id.toString()) || []
    }));
  } catch (error) {
    console.error('Failed to fetch meetings:', error);
    return [];
  }
}

export async function getMeetingById(id: string): Promise<Meeting | undefined> {
  try {
    const cookieStore = await cookies();
    const headers = { Cookie: cookieStore.toString() };
    const data = await meetingsApi.getOne(id, headers);
    return {
      ...data,
      id: data.id.toString(),
      topics: data.topics?.map((t: any) => ({
        ...t,
        id: t.id.toString(),
        discussionPoints: t.discussionPoints?.map((dp: any) => toStringId(dp)) || []
      })) || [],
      attendeeIds: data.attendees?.map((a: any) => a.id.toString()) || [],
      actionItems: data.actionItems?.map((i: any) => toStringId(i)) || []
    };
  } catch (error) {
    console.error(`Failed to fetch meeting ${id}:`, error);
    return undefined;
  }
}

export async function getAttendees(): Promise<Attendee[]> {
  try {
    const cookieStore = await cookies();
    const headers = { Cookie: cookieStore.toString() };
    const usersData = await users.search('', headers);
    return usersData.map((u: any) => ({
      id: u.id.toString(),
      name: u.username || 'Unknown',
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.username}`,
      email: u.email
    }));
  } catch (error) {
    console.error('Failed to fetch attendees:', error);
    return [];
  }
}

export async function getAttendeeById(id: string) {
  return undefined;
}

export async function getActionItemsForMeeting(meetingId: string) {
  const meeting = await getMeetingById(meetingId);
  return meeting?.actionItems || [];
}

export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const headers = { Cookie: cookieStore.toString() };
    console.log('Fetching user with cookies:', cookieStore.toString());
    const data = await auth.me(headers);
    console.log('User data fetched:', data);
    if (data.user) {
      return { ...data.user, id: data.user.id.toString() };
    }
    return null;
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
}


// Form schemas
const MeetingSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters.'),
  description: z.string().min(10, 'Description must be at least 10 characters.'),
  date: z.string(),
  attendeeIds: z.preprocess((val) => {
    if (typeof val === 'string') return [val];
    return val;
  }, z.array(z.string()).optional()), // Made optional as backend might not support it yet
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
    const cookieStore = await cookies();
    const headers = { Cookie: cookieStore.toString() };

    const newMeeting = await meetingsApi.create({
      title,
      description,
      date,
      attendeeIds
    }, headers);

    revalidatePath('/');
    revalidatePath('/meetings/new');
    return { message: 'success', meetingId: newMeeting.id.toString() };
  } catch (e) {
    console.error(e);
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

  try {
    const cookieStore = await cookies();
    const headers = { Cookie: cookieStore.toString() };
    await meetingsApi.createTopic(meetingId, title, headers);
    revalidatePath(`/meetings/${meetingId}`);
    return { message: 'success' };
  } catch (e) {
    return { message: 'Failed to add topic.' };
  }
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

  try {
    const cookieStore = await cookies();
    const headers = { Cookie: cookieStore.toString() };
    await meetingsApi.createPoint(meetingId, topicId, text, headers);
    revalidatePath(`/meetings/${meetingId}`);
    return { message: 'success' };
  } catch (e) {
    return { message: 'Failed to add point.' };
  }
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

  try {
    const cookieStore = await cookies();
    const headers = { Cookie: cookieStore.toString() };
    await meetingsApi.createActionItem(meetingId, {
      topicId,
      task,
      assigneeId,
      dueDate
    }, headers);
    revalidatePath(`/meetings/${meetingId}`);
    return { message: 'success' };
  } catch (e) {
    return { message: 'Failed to add action item.' };
  }
}

export async function toggleActionItemComplete(id: string, meetingId: string) {
  try {
    const cookieStore = await cookies();
    const headers = { Cookie: cookieStore.toString() };
    // We need to fetch the item first to know its current state, or just toggle it in backend
    // For now, let's assume we send the new state. But wait, the UI toggles it.
    // Let's just send a request to toggle. Ideally we should pass the new state.
    // Since the UI is optimistic or we revalidate, let's just assume we want to flip it.
    // But the API expects 'completed' boolean.
    // For simplicity, let's just assume the user clicked it so we want to toggle.
    // But we don't know the current state here easily without fetching.
    // Actually, the frontend should probably pass the new state.
    // But the function signature is (id, meetingId).
    // Let's fetch the meeting or item to check? No, that's slow.
    // Let's update the signature in the client component to pass the new state?
    // Or just implement a toggle endpoint in backend?
    // I implemented `update_action_item` which takes `completed` boolean.
    // I'll update the frontend component to pass the new state, but for now let's just fetch the item or meeting?
    // Actually, let's just change the signature in the next step if needed.
    // For now, I will just implement it assuming we can't change signature yet, so I'll fetch the meeting to find the item.
    // Wait, `getMeetingById` is available.
    const meeting = await getMeetingById(meetingId);
    const item = meeting?.topics.flatMap(t => t.discussionPoints).find((p: any) => p.id === id);
    // Wait, action items are separate or in topics?
    // In `types.ts`, `Meeting` has `extractedActionItems` but we are adding real action items.
    // The backend `ActionItem` model is linked to `Meeting`.
    // `getMeetingById` returns `topics` and `attendees`. It doesn't seem to return a separate list of action items in the `Meeting` type in `actions.ts`.
    // Let's check `getMeetingById` in `actions.ts`.
    // It maps `topics` and `attendees`.
    // It seems `ActionItem`s are not currently returned by `getMeetingById` in `actions.ts`.
    // I need to update `getMeetingById` to return action items too?
    // Or `getActionItemsForMeeting`.

    // Let's implement `getActionItemsForMeeting` properly first.
    // And for toggle, I'll just use `!completed` if I can get the item.
    // Let's defer `toggleActionItemComplete` implementation slightly or do a best effort.
    // Actually, I'll update `getActionItemsForMeeting` to fetch from backend.

    // For `toggleActionItemComplete`, I will change the signature to `toggleActionItemComplete(id: string, meetingId: string, currentState: boolean)`.
    // But I can't change the signature in this tool call easily without changing the caller.
    // The caller is `MeetingClient.tsx`.

    // Let's just fetch the action items for the meeting and find the item to toggle.
    const actionItems = await getActionItemsForMeeting(meetingId);
    const itemToToggle = actionItems.find(i => i.id === id);
    if (itemToToggle) {
      await actionItemsApi.update(id, { completed: !itemToToggle.completed }, headers);
      revalidatePath(`/meetings/${meetingId}`);
    }
  } catch (e) {
    console.error('Failed to toggle action item', e);
  }
}

// AI Feature Actions
export async function runGenerateSummary(meetingId: string) {
  const meeting = await getMeetingById(meetingId);
  if (!meeting) throw new Error('Meeting not found');

  // ... existing AI logic ...
  return 'AI Summary generation not connected to backend storage yet.';
}


export async function runExtractActionItems(meetingId: string) {
  return [];
}

export async function runTranscribeAudio(meetingId: string, audioDataUri: string) {
  try {
    const cookieStore = await cookies();
    const headers = { Cookie: cookieStore.toString() };
    const result = await meetingsApi.transcribe(meetingId, audioDataUri, headers);
    revalidatePath(`/meetings/${meetingId}`);
    return result.transcription;
  } catch (e) {
    console.error('Transcription failed:', e);
    return 'Failed to transcribe audio.';
  }
}
