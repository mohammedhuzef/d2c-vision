export interface ValidationStageInfo {
  id: string;
  name: string;
  weight: number;
  weightLabel: string;
  isCritical: boolean;
  oneLineDescription: string;
  ruleFromFacts: string;
  vetoBehavior?: string;
  dependencies?: string[];
}

export interface MetricCardItem {
  label: string;
  value: string;
  subtext?: string;
  status?: 'passed' | 'warning' | 'failed' | 'neutral';
}
