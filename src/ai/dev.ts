import { config } from 'dotenv';
config();

import '@/ai/flows/automated-meeting-summary.ts';
import '@/ai/flows/transcribe-meeting-audio.ts';
import '@/ai/flows/extract-structured-action-items.ts';