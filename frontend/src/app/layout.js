import './globals.css';

export const metadata = {
  title: 'Maaser Tracker - Track Your Maaser, Tzedakah & Gemach | Free Finance Tool',
  description: 'The simplest way to track maaser, tzedakah, and gemach loans. Auto-calculate maaser from income, log donations, track balances — with full Hebrew calendar support. Free for the frum community.',
  keywords: ['maaser', 'maaser tracker', 'maaser calculator', 'maaser manager', 'maser', 'maser tracker', 'tzedakah tracker', 'gemach tracker', 'jewish finance', 'maaser obligation', 'tithing calculator', 'frum finance', 'hebrew calendar finance', 'charity tracker'],
  authors: [{ name: 'Finance Tracker' }],
  openGraph: {
    title: 'Maaser Tracker - Know Exactly Where You Stand With Your Maaser',
    description: 'Track income, auto-calculate maaser, log every tzedakah and gemach. Full Hebrew calendar support. Free for the frum community.',
    type: 'website',
    locale: 'en_US',
    siteName: 'Maaser Tracker',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Maaser Tracker - Track Your Maaser, Tzedakah & Gemach',
    description: 'The simplest way to track maaser, tzedakah, and gemach loans. Free for the frum community.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  alternates: {
    canonical: '/',
  },
};

export default function RootLayout({ children }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Maaser Tracker',
    description: 'Track maaser, tzedakah, and gemach loans with auto-calculation and Hebrew calendar support.',
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Any',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    featureList: [
      'Automatic maaser calculation',
      'Tzedakah and gemach tracking',
      'Hebrew calendar support',
      'Multi-currency support',
      'Recurring transaction management',
      'Monthly email summaries',
    ],
  };

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;500;600;700&family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
