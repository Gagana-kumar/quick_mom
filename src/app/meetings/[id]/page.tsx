import { getActionItemsForMeeting, getAttendees, getMeetingById } from '@/lib/actions';
import { notFound } from 'next/navigation';
import MeetingClient from '@/components/meetings/MeetingClient';

export default async function MeetingDetailsPage({ params }: { params: { id: string } }) {
  const meeting = await getMeetingById(params.id);
  const allAttendees = await getAttendees();
  const allActionItems = await getActionItemsForMeeting(params.id);

  if (!meeting) {
    notFound();
  }

  const attendees = meeting.attendeeIds.map(id => allAttendees.find(a => a.id === id)).filter(Boolean);

  return <MeetingClient meeting={meeting} attendees={attendees} actionItems={allActionItems} />;
}
