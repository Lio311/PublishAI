import { auth } from "@/app/auth";

export async function checkIsAdmin() {
  const session = await auth();
  // Ensure both are present before comparing
  if (!session?.user?.email || !process.env.ADMIN_EMAIL) {
    return false;
  }
  
  const adminEmails = process.env.ADMIN_EMAIL.split(',').map(email => email.trim().toLowerCase());
  return adminEmails.includes(session.user.email.toLowerCase());
}
