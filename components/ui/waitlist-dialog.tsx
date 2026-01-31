import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

const WaitlistDialog: React.FC = () => {
  return (
    <div className="waitlist-dialog">
      <div className="dialog-content">
        {/* Divider area for registration notice */}
        <div className="divider-image">
          <Image
            src="/assets/images/background-image/not-registered.png"
            alt="Top preview"
            width={400}
            height={200}
          />
        </div>

        <div className="register-section">
          <h2>Didn’t registered yet?</h2>
          <p>
            Please Join our Alpha Waitlist first. In the next 24 Hours of Registration your access
            will be live
          </p>
          <div className="btn-action">
            <Link
              target="_blank"
              rel="noopener noreferrer"
              href="https://lawvriksh.com"
              className="register-btn"
            >
              Register
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WaitlistDialog;
