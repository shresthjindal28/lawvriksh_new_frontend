'use client';

import type { AnalysisScoreCardProps } from '@/types/analysis-sidebar';

/**
 * Reusable score card component for analysis results
 */
export default function AnalysisScoreCard({
  score,
  description,
  stats,
  scoreThreshold = 50,
  reverseColors = false,
}: AnalysisScoreCardProps) {
  // Determine color based on score
  const isGood = reverseColors ? score < scoreThreshold : score >= scoreThreshold;
  const colorClass = isGood ? 'green' : 'red';

  return (
    <div className="analysis-score-card">
      <div className="score-card-header">
        <div className="score-card-info">
          <p className={`score-card-main-score ${colorClass}`}>{Math.round(score)}%</p>
          <p className="score-card-description">{description}</p>
        </div>
      </div>

      <div className="score-stats-grid">
        {stats.map((stat, idx) => (
          <div key={idx} className="score-stat-box">
            <p className="score-stat-label">{stat.label}</p>
            <p className={`score-stat-value ${stat.color || ''}`}>{stat.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
