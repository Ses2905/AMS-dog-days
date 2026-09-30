import { redirect } from "next/navigation";

// Adding a player now happens in a panel at the top of the Team page.
export default function NewPlayerPage() {
  redirect("/roster");
}
