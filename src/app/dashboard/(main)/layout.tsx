import { CleanLayoutWrapper } from "@/components/dashboard/clean-layout-wrapper";

export default function DashboardMainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CleanLayoutWrapper>
      {children}
    </CleanLayoutWrapper>
  );
}
