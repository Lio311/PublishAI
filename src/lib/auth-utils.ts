import { auth } from "@/auth";

export async function checkIsAdmin() {
  const session = await auth();
  // Ensure both are present before comparing
  if (!session?.user?.email || !process.env.ADMIN_EMAIL) {
    return false;
  }
  return session.user.email.toLowerCase() === process.env.ADMIN_EMAIL.toLowerCase();
}
