import { redirect } from "next/navigation";

/** نقطة دخول موحّدة لبوابة الموظفين */
export default function EmployeeIndexPage() {
  redirect("/employee/dashboard");
}
