export default function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

export function headers() {
  return {
    "X-Frame-Options": "DENY",
    "Content-Security-Policy": "frame-ancestors 'none'",
  };
}
