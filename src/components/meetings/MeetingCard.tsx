import Link from 'next/link';
import { format } from 'date-fns';
import { Calendar, Users } from 'lucide-react';
import type { Meeting } from '@/lib/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

type MeetingCardProps = {
  meeting: Meeting;
};

export default function MeetingCard({ meeting }: MeetingCardProps) {
  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <CardTitle className="font-headline text-xl">{meeting.title}</CardTitle>
        <CardDescription className="flex items-center pt-1">
          <Calendar className="mr-2 h-4 w-4" />
          {format(new Date(meeting.date), 'PPP')}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-sm text-muted-foreground line-clamp-3">
          {meeting.description}
        </p>
      </CardContent>
      <CardFooter className="flex-col items-start gap-4">
        <div className="flex items-center">
          <Users className="mr-2 h-4 w-4" />
          <Badge variant="secondary">{meeting.attendeeIds.length} Attendees</Badge>
        </div>
        <Button asChild className="w-full">
          <Link href={`/meetings/${meeting.id}`}>View Details</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
