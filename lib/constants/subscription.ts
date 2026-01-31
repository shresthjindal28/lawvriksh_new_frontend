enum buttonStyle {
  primary = 'primary',
  secondary = 'secondary',
}

export const plans = [
  {
    name: 'Basic',
    price: 299,
    description: 'For a Individuals Students Starting Out their career',
    badge: null,
    features: ['upto 5 projects', 'Basic AI features', 'Access to Legal Databases'],
    previousFeatures: null,
    buttonText: 'I’d Pay for this',
    buttonStyle: buttonStyle.secondary,
    isHighlighted: false,
  },
  {
    name: 'Pro',
    price: 499,
    description: 'For Researchers looking to grow their career',
    badge: '243 People have share there Interest',
    features: ['upto 10 projects', 'Uptime Monitoring', 'Advanced 24 hours live support'],
    previousFeatures: 'All Basic features +',
    buttonText: 'I’d Pay for this',
    buttonStyle: buttonStyle.primary,
    isHighlighted: true,
  },
  {
    name: 'Ultimate',
    price: 799,
    originalPrice: 999,
    description: 'For Serious Researcher Team who wants a platform for collaboration',
    badge: null,
    features: ['Unlimited', 'Advanced AI insides', 'Access to all databases'],
    previousFeatures: 'All Pro features +',
    buttonText: 'I’d Pay for this',
    buttonStyle: buttonStyle.secondary,
    isHighlighted: false,
  },
];
