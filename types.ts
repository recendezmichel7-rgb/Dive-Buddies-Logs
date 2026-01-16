
export interface DiveLog {
  timestamp: string;
  date: string;       // Col B
  pointName: string;  // Col C
  diveTime: string;   // Col D
  maxDepth: string;   // Col E
  avgDepth: string;   // Col F
  waterTemp: string;  // Col G
  visibility: string; // Col H
  current: string;    // Col I
  waves: string;      // Col J
  guide: string;      // Col K
}

export interface DiveStats {
  totalDives: number;
  avgDepth: number;
  maxDepth: number;
  avgTemp: number;
}
