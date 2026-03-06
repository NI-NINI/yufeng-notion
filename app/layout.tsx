import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '宇豐案件系統',
  description: '宇豐不動產估價師事務所案件管理系統',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-TW">
      <body>{children}</body>
    </html>
  );
}
