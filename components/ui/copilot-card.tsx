'use client';

import type React from 'react';
import { CircleCheck, X } from 'lucide-react';
import { ArgumentLogic, Compliance, FactChecker } from '@/types/copilot';
import '@/styles/ui-styles/copilot-card.css';
export type CardMode = 'fact-checker' | 'compliance' | 'argument';

interface ModeCardProps {
  mode: CardMode;
  onButtonClick?: () => void;
  buttonLabel?: string;
  onDismiss?: () => void;
  onClose?: () => void;
}

interface FactCheckerCardProps extends Omit<ModeCardProps, 'mode'> {
  mode: 'fact-checker';
  fact?: FactChecker;
}

interface ComplianceCardProps extends Omit<ModeCardProps, 'mode'> {
  mode: 'compliance';
  compliance?: Compliance;
}

interface ArgumentCardProps extends Omit<ModeCardProps, 'mode'> {
  mode: 'argument';
  statement: string;
  contradictionScore: number;
  buttonLabel?: string;
  onButtonClick?: () => void;
}

type CardProps = FactCheckerCardProps | ComplianceCardProps | ArgumentCardProps;

export const ModeCard: React.FC<CardProps> = (props) => {
  const { mode, onButtonClick, buttonLabel = 'Action' } = props;

  const renderFactChecker = () => {
    const factProps = props as FactCheckerCardProps;
    return (
      <div className="mode-card fact-checker-card">
        <div className="card-header">
          <div className="verdict-badge">
            <span className="verdict-label">{factProps.fact?.verdict}</span>
            <span className="verdict-percentage">{factProps.fact?.confidence}% incorrect</span>
          </div>
          <button className="close-button" aria-label="Close" onClick={props.onDismiss}>
            <X size={20} />
          </button>
        </div>

        <div className="card-content">
          <div className="section">
            <h4 className="section-title">Current text:</h4>
            <div className="section-content current-text">
              {factProps.fact?.fact.wrongStatement.replace(/<[^>]*>/g, '')}
            </div>
          </div>

          <div className="section">
            <h4 className="section-title">Suggested correction:</h4>
            <div className="section-content suggested-correction">
              {factProps.fact?.fact.correctedStatement.replace(/<[^>]*>/g, '')}
            </div>
          </div>

          <div className="actions">
            <button className="action-button accept" onClick={onButtonClick}>
              <CircleCheck size={18} />
              {buttonLabel}
            </button>
            <button className="action-button dismiss" onClick={props.onDismiss}>
              Dismiss
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderCompliance = () => {
    const complianceProps = props as ComplianceCardProps;
    return (
      <div className="mode-card compliance-card">
        <div className="card-header">
          <div className="verdict-badge">
            <span className="verdict-label">{complianceProps.compliance?.verdict}</span>
            <span className="verdict-percentage">
              {complianceProps.compliance?.confidence}% incorrect
            </span>
          </div>
          <button className="close-button" aria-label="Close" onClick={props.onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="card-content">
          <div className="section">
            <h4 className="section-title">Current text:</h4>
            <div className="section-content current-text">
              {complianceProps.compliance?.statement.wrongStatement.replace(/<[^>]*>/g, '')}
            </div>
          </div>

          <div className="section">
            <h4 className="section-title">Justification</h4>
            <div className="section-content justification">
              <p className="justification-text">{complianceProps.compliance?.justification}</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderArgument = () => {
    const argProps = props as ArgumentCardProps;
    return (
      <div className="mode-card argument-card">
        <div className="card-header">
          <button className="card-button" onClick={onButtonClick} aria-label={buttonLabel}>
            <CircleCheck size={20} />
            {buttonLabel}
          </button>
        </div>
        <div className="card-content">
          <div className="argument-text">{argProps.statement}</div>

          <div className="score-section">
            <span className="score-label">Contradiction Score:</span>
            <div className="percentage-circle">
              <svg viewBox="0 0 100 100" className="circle-svg">
                <circle cx="50" cy="50" r="45" className="circle-bg" />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  className="circle-progress"
                  style={{
                    strokeDasharray: `${(argProps.contradictionScore / 100) * 283} 283`,
                  }}
                />
              </svg>
              <span className="percentage-text">{argProps.contradictionScore}%</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  switch (mode) {
    case 'fact-checker':
      return renderFactChecker();
    case 'compliance':
      return renderCompliance();
    case 'argument':
      return null;
    default:
      return null;
  }
};
