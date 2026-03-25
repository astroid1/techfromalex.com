export const metadata = {
  title: "Admin Login | Tech From Alex",
  robots: { index: false, follow: false },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Override admin layout - login gets a clean page
  return <>{children}</>;
}
