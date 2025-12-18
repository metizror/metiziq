export const metadata = {
  title: 'Contact Management System',
  description: 'aMFAccess - Contact Management System',
};

import '../styles/globals.css';
import '../index.css';
import StoreProvider from '../store/Provider';
import { Toaster } from '../components/ui/sonner';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <StoreProvider>{children}</StoreProvider>
        <Toaster />
      </body>
    </html>
  );
}


