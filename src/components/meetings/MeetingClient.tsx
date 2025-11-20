'use client';

import { useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import {
  BookOpen,
  Calendar,
  ClipboardCheck,
  FileText,
  Loader2,
  Mic,
  Plus,
  Sparkles,
  Users,
} from 'lucide-react';
import {
  addDiscussionPoint,
  addTopic,
  runExtractActionItems,
  runGenerateSummary,
  runTranscribeAudio,
  toggleActionItemComplete,
  addActionItem
} from '@/lib/actions';
import type { Meeting, Attendee, ActionItem, Topic, DiscussionPoint } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

const TopicSchema = z.object({ title: z.string().min(3, 'Topic title is required.') });
const PointSchema = z.object({ text: z.string().min(5, 'Point is required.') });
const ActionItemSchema = z.object({
  task: z.string().min(5, 'Task description is required'),
  assigneeId: z.string({ required_error: "Please select an assignee." }),
  dueDate: z.date({ required_error: "A due date is required." }),
});

function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
      {children}
    </Button>
  );
}

export default function MeetingClient({ meeting, attendees, actionItems }: { meeting: Meeting; attendees: Attendee[], actionItems: ActionItem[] }) {
  const { toast } = useToast();
  const [summary, setSummary] = useState(meeting.summary || '');
  const [extractedItems, setExtractedItems] = useState(meeting.extractedActionItems || []);
  const [transcription, setTranscription] = useState(meeting.transcription || '');
  const [loading, setLoading] = useState({ summary: false, extract: false, transcribe: false });
  const [isTopicFormOpen, setIsTopicFormOpen] = useState(false);
  const [isPointFormOpen, setIsPointFormOpen] = useState<string | false>(false);
  const [isActionItemFormOpen, setIsActionItemFormOpen] = useState<string | false>(false);

  const [topicFormState, topicFormAction] = useFormState(addTopic, { message: '' });
  const [pointFormState, pointFormAction] = useFormState(addDiscussionPoint, { message: '' });
  const [actionItemFormState, actionItemFormAction] = useFormState(addActionItem, { message: '' });
  
  const topicForm = useForm({ resolver: zodResolver(TopicSchema), defaultValues: { title: '' } });
  const pointForm = useForm({ resolver: zodResolver(PointSchema), defaultValues: { text: '' } });
  const actionItemForm = useForm({ resolver: zodResolver(ActionItemSchema) });

  const handleGenerateSummary = async () => {
    setLoading(prev => ({ ...prev, summary: true }));
    const result = await runGenerateSummary(meeting.id);
    setSummary(result);
    setLoading(prev => ({ ...prev, summary: false }));
    toast({ title: 'Summary generated!' });
  };

  const handleExtractActionItems = async () => {
    setLoading(prev => ({ ...prev, extract: true }));
    const result = await runExtractActionItems(meeting.id);
    setExtractedItems(result);
    setLoading(prev => ({ ...prev, extract: false }));
    toast({ title: 'Action items extracted!' });
  };

  const handleTranscribeAudio = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(prev => ({ ...prev, transcribe: true }));
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const audioDataUri = reader.result as string;
      const result = await runTranscribeAudio(meeting.id, audioDataUri);
      setTranscription(result);
      setLoading(prev => ({ ...prev, transcribe: false }));
      toast({ title: 'Audio transcribed!' });
    };
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Topics and Discussion Points */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="font-headline flex items-center"><BookOpen className="mr-2 h-5 w-5" />Topics</CardTitle>
                <CardDescription>Discussion points and decisions.</CardDescription>
              </div>
              <Dialog open={isTopicFormOpen} onOpenChange={setIsTopicFormOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline"><Plus className="mr-2 h-4 w-4" />Add Topic</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Topic</DialogTitle>
                  </DialogHeader>
                  <Form {...topicForm}>
                    <form action={topicFormAction} onSubmit={topicForm.handleSubmit((data) => {
                        const formData = new FormData();
                        formData.append('meetingId', meeting.id);
                        formData.append('title', data.title);
                        topicFormAction(formData);
                        setIsTopicFormOpen(false);
                        topicForm.reset();
                    })} className="space-y-4">
                      <input type="hidden" name="meetingId" value={meeting.id} />
                      <FormField control={topicForm.control} name="title" render={({ field }) => (
                          <FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <DialogFooter><SubmitButton>Add Topic</SubmitButton></DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <Accordion type="multiple" defaultValue={meeting.topics.map(t => t.id)}>
                {meeting.topics.map((topic) => (
                  <AccordionItem value={topic.id} key={topic.id}>
                    <AccordionTrigger className="font-semibold">{topic.title}</AccordionTrigger>
                    <AccordionContent className="space-y-4">
                      <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
                        {topic.discussionPoints.map((point) => <li key={point.id}>{point.text}</li>)}
                      </ul>
                      <Dialog open={isPointFormOpen === topic.id} onOpenChange={(isOpen) => setIsPointFormOpen(isOpen ? topic.id : false)}>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm"><Plus className="mr-2 h-4 w-4" />Add Point</Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader><DialogTitle>Add Discussion Point to "{topic.title}"</DialogTitle></DialogHeader>
                          <Form {...pointForm}>
                            <form action={pointFormAction} onSubmit={pointForm.handleSubmit(data => {
                                const formData = new FormData();
                                formData.append('meetingId', meeting.id);
                                formData.append('topicId', topic.id);
                                formData.append('text', data.text);
                                pointFormAction(formData);
                                setIsPointFormOpen(false);
                                pointForm.reset();
                            })} className="space-y-4">
                              <FormField control={pointForm.control} name="text" render={({ field }) => (
                                  <FormItem><FormLabel>Point</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                              )} />
                              <DialogFooter><SubmitButton>Add Point</SubmitButton></DialogFooter>
                            </form>
                          </Form>
                        </DialogContent>
                      </Dialog>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
          
          {/* Action Items */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="font-headline flex items-center"><ClipboardCheck className="mr-2 h-5 w-5" />Action Items</CardTitle>
                <CardDescription>Tasks and responsibilities.</CardDescription>
              </div>
              <Dialog open={isActionItemFormOpen === meeting.id} onOpenChange={(isOpen) => setIsActionItemFormOpen(isOpen ? meeting.id : false)}>
                  <DialogTrigger asChild><Button variant="outline"><Plus className="mr-2 h-4 w-4" />Add Item</Button></DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Add Action Item</DialogTitle></DialogHeader>
                    <Form {...actionItemForm}>
                    <form action={actionItemFormAction} onSubmit={actionItemForm.handleSubmit(data => {
                        const formData = new FormData();
                        formData.append('meetingId', meeting.id);
                        formData.append('topicId', meeting.topics[0]?.id || 'general');
                        formData.append('task', data.task);
                        formData.append('assigneeId', data.assigneeId);
                        formData.append('dueDate', data.dueDate.toISOString());
                        actionItemFormAction(formData);
                        setIsActionItemFormOpen(false);
                        actionItemForm.reset();
                    })} className="space-y-4">
                        <FormField control={actionItemForm.control} name="task" render={({ field }) => (
                            <FormItem><FormLabel>Task</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                        <FormField control={actionItemForm.control} name="assigneeId" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Assign To</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl><SelectTrigger><SelectValue placeholder="Select an attendee" /></SelectTrigger></FormControl>
                              <SelectContent>{attendees.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}/>
                        <FormField control={actionItemForm.control} name="dueDate" render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Due Date</FormLabel>
                            <Popover><PopoverTrigger asChild><FormControl>
                              <Button variant="outline" className={cn('w-full pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}>
                                {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl></PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <CalendarComponent mode="single" selected={field.value} onSelect={field.onChange} initialFocus/>
                            </PopoverContent></Popover>
                            <FormMessage />
                          </FormItem>
                        )}/>
                        <DialogFooter><SubmitButton>Add Action Item</SubmitButton></DialogFooter>
                    </form>
                    </Form>
                  </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">Done</TableHead>
                    <TableHead>Task</TableHead>
                    <TableHead>Assignee</TableHead>
                    <TableHead>Due Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {actionItems.map(item => {
                    const assignee = attendees.find(a => a.id === item.assigneeId);
                    return (
                        <TableRow key={item.id}>
                          <TableCell><Checkbox checked={item.completed} onCheckedChange={() => toggleActionItemComplete(item.id, meeting.id)} /></TableCell>
                          <TableCell className={cn(item.completed && 'line-through text-muted-foreground')}>{item.task}</TableCell>
                          <TableCell>{assignee?.name || 'Unassigned'}</TableCell>
                          <TableCell>{format(new Date(item.dueDate), 'MMM d, yyyy')}</TableCell>
                        </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-8">
          {/* Meeting Details */}
          <Card>
            <CardHeader><CardTitle className="font-headline">{meeting.title}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center text-sm"><Calendar className="mr-2 h-4 w-4 text-muted-foreground" /> {format(new Date(meeting.date), 'PPPP')}</div>
              <p className="text-sm text-muted-foreground">{meeting.description}</p>
              <Separator />
              <h4 className="font-semibold flex items-center"><Users className="mr-2 h-4 w-4" />Attendees</h4>
              <div className="flex flex-wrap gap-4">
                {attendees.map(attendee => (
                  <div key={attendee.id} className="flex items-center gap-2 text-sm">
                    <Avatar className="h-8 w-8"><AvatarImage src={attendee.avatarUrl} alt={attendee.name} /><AvatarFallback>{attendee.name.charAt(0)}</AvatarFallback></Avatar>
                    <span>{attendee.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* AI Features */}
          <Card>
            <CardHeader>
                <CardTitle className="font-headline flex items-center"><Sparkles className="mr-2 h-5 w-5 text-accent" />AI Assistant</CardTitle>
                <CardDescription>Generate summaries, extract tasks, and more.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Summary */}
                <Button onClick={handleGenerateSummary} disabled={loading.summary} className="w-full bg-accent/20 text-accent-foreground hover:bg-accent/30"><FileText className="mr-2 h-4 w-4" />{loading.summary ? 'Generating...' : 'Generate Summary'}</Button>
                {summary && <Card className="bg-background"><CardContent className="p-4 text-sm whitespace-pre-wrap font-sans">{summary}</CardContent></Card>}

                {/* Action Items */}
                <Button onClick={handleExtractActionItems} disabled={loading.extract} className="w-full bg-accent/20 text-accent-foreground hover:bg-accent/30"><ClipboardCheck className="mr-2 h-4 w-4" />{loading.extract ? 'Extracting...' : 'Extract Action Items'}</Button>
                {extractedItems.length > 0 && (
                    <Card className="bg-background"><CardContent className="p-4 text-sm space-y-2">
                        {extractedItems.map((item, i) => <p key={i}><strong>{item.assignee}:</strong> {item.item} (by {item.deadline})</p>)}
                    </CardContent></Card>
                )}

                {/* Transcription */}
                <Button asChild className="w-full bg-accent/20 text-accent-foreground hover:bg-accent/30"><label htmlFor="audio-upload"><Mic className="mr-2 h-4 w-4" />{loading.transcribe ? 'Transcribing...' : 'Transcribe Audio'}</label></Button>
                <Input id="audio-upload" type="file" accept="audio/*" onChange={handleTranscribeAudio} className="hidden" />
                {transcription && <Card className="bg-background"><CardContent className="p-4 text-sm whitespace-pre-wrap font-sans">{transcription}</CardContent></Card>}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
