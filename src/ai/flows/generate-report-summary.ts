'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating a summary report of key findings from computed environmental metrics.
 *
 * - generateReportSummary - A function that generates a summary report of environmental metrics.
 * - ReportSummaryInput - The input type for the generateReportsummary function.
 * - ReportSummaryOutput - The return type for the generateReportsummary function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { executePromptWithFallback, safeParseAIJson } from '@/ai/ai-utils';

const ReportSummaryInputSchema = z.object({
  metricsData: z.string().describe('A JSON string containing the computed environmental metrics data. Should include metric name, start/end values, percentage change, and number of valid data points (n).'),
  location: z.string().describe('The location (latitude and longitude) for which the metrics were computed.'),
  dateRange: z.string().describe('The date range for which the metrics were computed (e.g., "January 1, 2023 - December 31, 2023").'),
});
export type ReportSummaryInput = z.infer<typeof ReportSummaryInputSchema>;

const ReportSummaryOutputSchema = z.object({
  summaryReport: z.string().describe('A comprehensive, well-structured analytical report including an executive summary, key findings, and potential implications based on the provided environmental metrics.'),
});
export type ReportSummaryOutput = z.infer<typeof ReportSummaryOutputSchema>;

const generateReportSummaryPrompt = ai.definePrompt({
  name: 'generateReportSummaryPrompt',
  input: {schema: ReportSummaryInputSchema},
  prompt: `You are an expert environmental data analyst AI. Your task is to generate a comprehensive, professional, and insightful report based on satellite data.

**Analysis Context:**
- Location: {{{location}}}
- Date Range: {{{dateRange}}}
- Metrics Data (JSON string): {{{metricsData}}}

**Report Structure and Output Format:**
Your output MUST be a valid JSON object ONLY, with a single key "summaryReport". The value of this key must be a single string containing a well-formatted report with the following sections, using Markdown for formatting:

1.  **Executive Summary:** Start with a high-level overview of the most critical changes and their potential significance in 2-3 sentences.

2.  **Key Findings:** List the most significant observations as bullet points. Focus on the largest percentage changes or trends that stand out (e.g., significant vegetation loss, increase in built-up areas).

3.  **Detailed Analysis:** Provide a brief analysis for each key metric category (Indices, Land Cover). Discuss the trends and what they might indicate. For example, a decrease in NDVI coupled with an increase in NDBI might suggest urbanization at the expense of green spaces.

4.  **Potential Implications & Recommendations:** Based on the analysis, briefly suggest potential real-world implications (e.g., potential impact on local agriculture, water resource strain, habitat loss). If applicable, suggest one or two areas for further investigation.

The tone should be objective, scientific, and clear.
`,
});

export async function generateReportSummary(input: ReportSummaryInput): Promise<ReportSummaryOutput> {
    try {
      const response = await executePromptWithFallback(generateReportSummaryPrompt, input, undefined, 'report-summary');
      const textResponse = response.text;
      if (!textResponse) {
          throw new Error("The AI model did not return a summary report. Please try again.");
      }
      
      const parsedJson = safeParseAIJson(textResponse, (data) => ReportSummaryOutputSchema.parse(data));
      return parsedJson;

    } catch (error) {
      console.error('Error generating report summary:', error);
      throw new Error(`Failed to generate report summary: ${(error as any).message || 'Unknown error'}`);
    }
}
