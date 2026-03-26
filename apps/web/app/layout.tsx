export const metadata = {
  title: 'devwrapped',
  description: 'Your Claude Code stats, visualized and shared.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
