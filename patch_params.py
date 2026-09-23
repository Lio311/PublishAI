import re

with open("src/app/[locale]/(dashboard)/learning/page.tsx", "r") as f:
    content = f.read()

old_params = """export default async function AILearningPage({ params }: { params: { locale: string } }) {
  const isAdmin = await checkIsAdmin();
  const locale = params.locale;
  if (!isAdmin) {
    redirect(`/${locale}`);
  }
  
  const isHe = locale === "he";"""

new_params = """export default async function AILearningPage({ params }: { params: Promise<{ locale: string }> | { locale: string } }) {
  const resolvedParams = await params;
  const locale = resolvedParams.locale;
  
  const isAdmin = await checkIsAdmin();
  if (!isAdmin) {
    redirect(`/${locale}`);
  }
  
  const isHe = locale === "he";"""

content = content.replace(old_params, new_params)

with open("src/app/[locale]/(dashboard)/learning/page.tsx", "w") as f:
    f.write(content)
