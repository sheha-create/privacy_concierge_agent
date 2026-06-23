import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Privacy Guardian - Your Personal Document Security Agent',
  description: 'AI-powered document management with built-in privacy protection. Your data stays on your device.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="noise-overlay">{children}</body>
    </html>
  );
}