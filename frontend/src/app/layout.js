import 'bootstrap/dist/css/bootstrap.min.css';
import './globals.css';
import { ReduxProvider } from '../redux/provider.js';

export const metadata = {
  title: 'TravelSphere - Enterprise Travel Social Network',
  description: 'Connect, share itineraries, create travel logs, and explore destinations with the global travel community.',
  keywords: ['travel', 'social media', 'journal', 'itinerary', 'reels', 'meetups', 'backpacking', 'routes'],
  openGraph: {
    title: 'TravelSphere',
    description: 'Connect, share itineraries, create travel logs, and explore destinations.',
    type: 'website'
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ReduxProvider>
          {children}
        </ReduxProvider>
      </body>
    </html>
  );
}
