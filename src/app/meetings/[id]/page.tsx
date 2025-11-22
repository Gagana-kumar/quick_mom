import { getActionItemsForMeeting, getAttendees, getMeetingById, getCurrentUser } from '@/lib/actions';
import { notFound, redirect } from 'next/navigation';
import MeetingClient from '@/components/meetings/MeetingClient';

export default async function MeetingDetailsPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }
  const meeting = await getMeetingById(params.id);
  const allAttendees = await getAttendees();
  const allActionItems = await getActionItemsForMeeting(params.id);

  if (!meeting) {
    notFound();
  }

  const attendees = meeting.attendeeIds
    .map(id => allAttendees.find(a => a.id === id))
    .filter((a): a is typeof allAttendees[0] => a !== undefined);

  return <MeetingClient meeting={meeting} attendees={attendees} actionItems={allActionItems} />;
}
