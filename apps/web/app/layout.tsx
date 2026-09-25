import type { Metadata } from 'next';
import { SiteHeader } from '../components/layout/site-header';
import { AuthProvider } from '../providers/auth-provider';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Dhaka Tesla Pool',
    template: '%s · Dhaka Tesla Pool',
  },
  description: 'Share a seat. Split the fare. Survive Dhaka traffic.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <AuthProvider>
          <SiteHeader />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
