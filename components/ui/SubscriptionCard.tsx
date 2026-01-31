interface SubscriptionCardProps {
  name: string;
  price: number;
  originalPrice?: number;
  description: string;
  badge: string | null;
  features: string[];
  buttonText: string;
  buttonStyle: 'primary' | 'secondary';
  isHighlighted: boolean;
  previousFeatures: string | null;
  onClick: () => void;
}

export default function SubscriptionCard({
  name,
  price,
  originalPrice,
  description,
  badge,
  features,
  buttonText,
  buttonStyle,
  isHighlighted,
  previousFeatures,
  onClick,
}: SubscriptionCardProps) {
  return (
    <div className={`subscription-card ${isHighlighted ? 'highlighted' : ''}`}>
      {badge && <div className={`card-badge ${isHighlighted ? 'yellow' : 'gray'}`}>{badge}</div>}

      <h2 className="card-title">{name}</h2>
      <p className="card-description">{description}</p>

      <div className="card-price-section">
        <span className="card-price">₹{price}</span>
        {originalPrice && <span className="card-original-price">/ per user</span>}
      </div>
      <p className={previousFeatures ? 'card-per-month' : 'card-per-month-bottom'}>per month</p>
      {previousFeatures && <p className="card-previous-features">{previousFeatures}</p>}

      <ul className="card-features">
        {features.map((feature, index) => (
          <li key={index} className="feature-item">
            <svg
              className="feature-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <button onClick={onClick} className={`card-button ${buttonStyle}`}>
        {buttonText}
      </button>
    </div>
  );
}
