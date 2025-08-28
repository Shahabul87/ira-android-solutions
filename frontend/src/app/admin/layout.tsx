import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Dashboard - Enterprise Auth Template',
  description: 'Administrative interface for user and role management',
};

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminRootLayout({ children }: AdminLayoutProps): JSX.Element {
  return <>{children}</>;
}