import styles from "@/app/styles/Main.module.scss"
import { usePathname } from "next/navigation"

export default function Main({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const registrationPaths = [
    "/recipes/new"
  ]
  const bgColor = registrationPaths.some(path => pathname?.startsWith(path)) || 
    (pathname?.startsWith("/recipes/") && /^\/recipes\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(pathname || ""))

  return (
    <main className="w-full" style={{ backgroundColor: bgColor ? "#fff" : "inherit" }}>
      <div className={styles.contents_wrapper}>{children}</div>
    </main>
  );
}