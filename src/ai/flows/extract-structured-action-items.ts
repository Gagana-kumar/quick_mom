'use server';

/**
 * @fileOverview Extracts structured action items from meeting discussions.
 *
 * - extractActionItems - Extracts action items with assignee and deadline.
 * - ExtractActionItemsInput - The input type for the extractActionItems function.
 * - ExtractActionItemsOutput - The return type for the extractActionItems function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExtractActionItemsInputSchema = z.object({
  meetingText: z
    .string()
    .describe('The full text content of the meeting discussion.'),
});
export type ExtractActionItemsInput = z.infer<typeof ExtractActionItemsInputSchema>;

const ExtractActionItemsOutputSchema = z.array(z.object({
  item: z.string().describe('The action item description.'),
  assignee: z.string().describe('The person assigned to the action item.'),
  deadline: z.string().describe('The deadline for the action item.'),
}));
export type ExtractActionItemsOutput = z.infer<typeof ExtractActionItemsOutputSchema>;

export async function extractActionItems(input: ExtractActionItemsInput): Promise<ExtractActionItemsOutput> {
  return extractActionItemsFlow(input);
}

const extractActionItemsPrompt = ai.definePrompt({
  name: 'extractActionItemsPrompt',
  input: {schema: ExtractActionItemsInputSchema},
  output: {schema: ExtractActionItemsOutputSchema},
  prompt: `You are an AI assistant helping to extract action items from meeting transcripts.

  Given the following meeting transcript, extract all action items, the person assigned to the action item, and the deadline for the action item. Return the results as a JSON array.

  Meeting Transcript:
  {{meetingText}}
  `,
});

const extractActionItemsFlow = ai.defineFlow(
  {
    name: 'extractActionItemsFlow',
    inputSchema: ExtractActionItemsInputSchema,
    outputSchema: ExtractActionItemsOutputSchema,
  },
  async input => {
    const {output} = await extractActionItemsPrompt(input);
    return output!;
  }
);
