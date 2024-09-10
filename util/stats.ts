export type StatsCounter = {
  input_tokens: number;
  output_tokens: number;
  api_calls: number;
  api_call_fails: number;
};
export function zeroStatsCounter(): StatsCounter {
  return { input_tokens: 0, output_tokens: 0, api_calls: 0, api_call_fails: 0 };
}
