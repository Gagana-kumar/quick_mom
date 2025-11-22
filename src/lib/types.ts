export interface Attendee {
  id: string;
  name: string;
  avatarUrl: string;
}

export interface ActionItem {
  id: string;
  task: string;
  assigneeId: string;
  dueDate: string;
  completed: boolean;
  meetingId: string;
  topicId: string;
}

export interface DiscussionPoint {
  id: string;
  text: string;
}

export interface Topic {
  id: string;
  title: string;
  discussionPoints: DiscussionPoint[];
}

export interface Meeting {
export interface Attendee {
  id: string;
  name: string;
  avatarUrl: string;
}

export interface ActionItem {
  id: string;
  task: string;
  assigneeId: string;
  dueDate: string;
  completed: boolean;
  meetingId: string;
  topicId: string;
}

export interface DiscussionPoint {
  id: string;
  text: string;
}

export interface Topic {
  id: string;
  title: string;
  discussionPoints: DiscussionPoint[];
}

export interface Meeting {
  id: string;
  title: string;
  date: string;
  description: string;
  attendeeIds: string[];
  topics: Topic[];
  actionItems?: ActionItem[];
  summary?: string;
  extractedActionItems?: {
    item: string;
    assignee: string;
    deadline: string;
  }[];
  transcription?: string;
}
