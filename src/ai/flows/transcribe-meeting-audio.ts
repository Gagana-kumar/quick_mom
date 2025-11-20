'use server';
/**
 * @fileOverview Converts meeting audio recordings into text using Genkit and OpenAI Whisper.
 *
 * - transcribeMeetingAudio -  The function that handles the audio transcription process.
 * - TranscribeMeetingAudioInput - The input type for the transcribeMeetingAudio function.
 * - TranscribeMeetingAudioOutput - The return type for the transcribeMeetingAudio function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import wav from 'wav';

const TranscribeMeetingAudioInputSchema = z.object({
  audioDataUri: z
    .string()
    .describe(
      'The audio recording of the meeting, as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.'  
    ),
});
export type TranscribeMeetingAudioInput = z.infer<typeof TranscribeMeetingAudioInputSchema>;

const TranscribeMeetingAudioOutputSchema = z.object({
  transcription: z.string().describe('The transcribed text from the audio recording.'),
});
export type TranscribeMeetingAudioOutput = z.infer<typeof TranscribeMeetingAudioOutputSchema>;

export async function transcribeMeetingAudio(input: TranscribeMeetingAudioInput): Promise<TranscribeMeetingAudioOutput> {
  return transcribeMeetingAudioFlow(input);
}

const transcribeMeetingAudioFlow = ai.defineFlow({
    name: 'transcribeMeetingAudioFlow',
    inputSchema: TranscribeMeetingAudioInputSchema,
    outputSchema: TranscribeMeetingAudioOutputSchema,
  },
  async input => {
    const { media } = await ai.generate({
      model: ai.model,
      config: {
        responseModalities: ['AUDIO'],
      },
      prompt: input.audioDataUri,
    });

    let transcription = '';

    if (media?.url) {
      transcription = media.url;
    }

    return {
      transcription: transcription,
    };
  }
);
