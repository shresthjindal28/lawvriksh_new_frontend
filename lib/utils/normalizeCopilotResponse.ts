import {
  CopilotResponse,
  FactChecker,
  Compliance,
  ArgumentLogic,
  ArgumentLogicStatement,
  BackendArgumentLogicResponse,
  BackendContradictionSet,
  BackendContradictionItem,
} from '@/types/copilot';
import { FetchClient } from '../api/fetchClient';

export function normalizeCopilotData(data: CopilotResponse | null): {
  facts: FactChecker[];
  compliances: Compliance[];
  argumentSets: ArgumentLogic[];
  percentage: number;
} {
  if (!data) {
    return {
      facts: [],
      compliances: [],
      argumentSets: [],
      percentage: 0,
    };
  }

  const facts: FactChecker[] = data.fact
    ? Array.isArray(data.fact)
      ? data.fact
      : [data.fact]
    : [];

  const compliances: Compliance[] = data.compliance
    ? Array.isArray(data.compliance)
      ? data.compliance
      : [data.compliance]
    : [];

  const argumentSets: ArgumentLogic[] = data.argumentLogic
    ? Array.isArray(data.argumentLogic)
      ? data.argumentLogic
      : [data.argumentLogic]
    : [];

  const percentage =
    typeof data.Analysispercentage === 'number'
      ? Math.max(0, Math.min(100, data.Analysispercentage))
      : 0;

  return { facts, compliances, argumentSets, percentage };
}

export async function transformArgumentLogicResponse(
  response: any
): Promise<ArgumentLogic[] | null> {
  console.log('Raw response data:', response);

  // Handle the actual API response structure with lines array
  const lines = response?.lines || response?.data?.lines;
  if (!lines || !Array.isArray(lines) || lines.length === 0) {
    console.log('No lines found in response');
    return null;
  }

  console.log('Found lines:', lines.length, 'lines to process');

  // Extract wrong statements from lines
  const wrongStatements = lines.map((line: any, idx: number) => {
    return line.text || line.content || `Statement ${idx + 1}`;
  });

  // Get corrected statements from API
  const correctedStatements = await getCorrectedStatements(wrongStatements);

  // Create statements with corrected versions
  const statements = lines.map((line: any, idx: number) => {
    const wrongStatement = line.text || line.content || `Statement ${idx + 1}`;

    return {
      id: `arg_${idx}`,
      block_id: '',
      wrongStatement,
      correctedStatement:
        correctedStatements[idx] ||
        'Consider revising this statement for better logical consistency.',
    };
  });

  console.log('Transformed statements with corrections:', statements);

  // Convert to the new ContradictionSet structure
  const set: import('../../types/copilot').ContradictionSet = {
    set_id: `set_${Date.now()}`,
    score: 0.5,
    contradictions: [],
  };

  return [
    {
      sets: [set],
      score: 0.5,
    },
  ];
}

export async function getCorrectedStatements(statements: string[]): Promise<string[]> {
  const correctedStatements: string[] = [];

  for (const statement of statements) {
    console.log('Processing statement:', statement);
    try {
      const requestBody = {
        text: statement,
      };
      console.log('API Request Body:', requestBody);

      const response = await FetchClient.makeRequest<any>('api/ai/argument-logic/check', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      console.log('API Response:', response);

      if (response.success && response.data) {
        let correctedText = statement;

        if (
          response.data.lines &&
          Array.isArray(response.data.lines) &&
          response.data.lines.length > 0
        ) {
          const firstLine = response.data.lines[0];
          correctedText = firstLine.text || firstLine.content || statement;
          console.log('Extracted corrected text from lines:', correctedText);
        } else if (typeof response.data === 'string') {
          correctedText = response.data;
          console.log('Using corrected text as string:', correctedText);
        } else {
          correctedText = JSON.stringify(response.data);
          console.log('Using corrected text as stringified object:', correctedText);
        }

        console.log('Final corrected text:', correctedText);
        correctedStatements.push(correctedText);
      } else {
        correctedStatements.push(statement);
      }
    } catch (error) {
      console.error('Error getting corrected statement:', error);
      correctedStatements.push(statement);
    }
  }

  return correctedStatements;
}
