import { ReactNode } from "react";
import { employeeRoomNavLinksBar, sidebarLinks, topNavLinks } from "@/lib/site/public-site-config";
import { SiteHeader } from "@/components/layout/site-header";
import { DepartmentsBar } from "@/components/layout/departments-bar";

type MainShellProps = {
  children: ReactNode;
};

export function MainShell({ children }: MainShellProps) {
  return (
    <div className="min-h-screen bg-[#f5f3ef]">
      <SiteHeader
        topNavLinks={topNavLinks}
        sidebarLinks={sidebarLinks}
        employeeRoomLinks={employeeRoomNavLinksBar}
      />
      <DepartmentsBar
        prefixLinks={[
          { href: "/", label: "الرئيسية" }
        ]}
        links={employeeRoomNavLinksBar}
      />
      <main className="mx-auto w-full max-w-screen-2xl px-4 py-8">{children}</main>
    </div>
  );
}
