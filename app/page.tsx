import { redirect } from "next/navigation";

export default function Home() {
  // Redirect to projects dashboard
  redirect("/projects");
}
