import { redirect } from "next/navigation";

export default function Home() {
  // Redirect to clients dashboard
  redirect("/clients");
}
