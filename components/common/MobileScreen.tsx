import React from 'react';
import { ArrowLeft, Monitor } from 'lucide-react';
import Link from 'next/link';

const MobileScreen: React.FC = () => {
  return (
    <div className="mobile-warning-container">
      <div className="mobile-warning-content">
        <Monitor size={64} strokeWidth={1.5} className="monitor-icon" />
        <h1>Desktop Required</h1>
        <p>Please visit this site from a desktop or laptop for the best experience.</p>
        <Link href="/dashboard" className="back-to-home">
          <ArrowLeft size={16} strokeWidth={1.5} />
          Back to Home
        </Link>
      </div>

      <style jsx>{`
        .mobile-warning-container {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          min-height: 100svh;
          padding: 24px;
          background: white;
        }

        .back-to-home {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 24px;
          color: black;
          text-decoration: none;
        }

        .mobile-warning-content {
          text-align: center;
          color: black;
          max-width: 400px;
        }

        .monitor-icon {
          margin: 0 auto 24px;
          opacity: 0.9;
        }

        h1 {
          margin: 0 0 16px 0;
          font-size: 28px;
          font-weight: 600;
        }

        p {
          margin: 0;
          font-size: 16px;
          line-height: 1.6;
          opacity: 0.95;
        }
      `}</style>
    </div>
  );
};

export default MobileScreen;
