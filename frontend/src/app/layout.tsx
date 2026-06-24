import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Privacy Guardian AI - Enterprise Cybersecurity Platform',
  description: 'AI-powered document security and privacy protection platform. Monitor threats, detect PII, and protect your digital footprint.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {/* Cyber Grid Background */}
        <div className="cyber-grid" aria-hidden="true" />
        
        {/* Floating Particles */}
        <div className="particles" aria-hidden="true">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="particle"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 20}s`,
                animationDuration: `${15 + Math.random() * 10}s`,
              }}
            />
          ))}
        </div>
        
        {children}
      </body>
    </html>
  );
}