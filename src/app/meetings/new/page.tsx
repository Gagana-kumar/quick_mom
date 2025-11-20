import { getAttendees } from "@/lib/actions";
import CreateMeetingForm from "@/components/meetings/CreateMeetingForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function NewMeetingPage() {
  const attendees = await getAttendees();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline text-2xl">Create a New Meeting</CardTitle>
            <CardDescription>Fill out the details below to schedule your meeting.</CardDescription>
          </CardHeader>
          <CardContent>
            <CreateMeetingForm attendees={attendees} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
