'use server';

/**
 * @fileOverview Generates an automated meeting summary using Genkit and the googleAI plugin.
 *
 * - generateMeetingSummary - A function that takes meeting transcript and outputs a summary.
 * - GenerateMeetingSummaryInput - The input type for the generateMeetingSummary function.
 * - GenerateMeetingSummaryOutput - The return type for the generateMeetingSummary function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateMeetingSummaryInputSchema = z.object({
  transcript: z
    .string()
    .describe('The transcript of the meeting to be summarized.'),
});
export type GenerateMeetingSummaryInput = z.infer<typeof GenerateMeetingSummaryInputSchema>;

const GenerateMeetingSummaryOutputSchema = z.object({
  summary: z
    .string()
    .describe('The summary of the meeting transcript.'),
});
export type GenerateMeetingSummaryOutput = z.infer<typeof GenerateMeetingSummaryOutputSchema>;

export async function generateMeetingSummary(input: GenerateMeetingSummaryInput): Promise<GenerateMeetingSummaryOutput> {
  return generateMeetingSummaryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateMeetingSummaryPrompt',
  input: {schema: GenerateMeetingSummaryInputSchema},
  output: {schema: GenerateMeetingSummaryOutputSchema},
  prompt: `You are an AI assistant tasked with summarizing meeting transcripts. Please provide a concise summary of the following transcript:\n\nTranscript: {{{transcript}}}`,
});

const generateMeetingSummaryFlow = ai.defineFlow(
  {
    name: 'generateMeetingSummaryFlow',
    inputSchema: GenerateMeetingSummaryInputSchema,
    outputSchema: GenerateMeetingSummaryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
