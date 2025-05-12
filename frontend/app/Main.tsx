import styles from "@/app/styles/Main.module.scss"
import { usePathname } from "next/navigation"
import useLoadingStore from "./stores/loadingStore"
import Loading from "./components/ui/Loading/Loading"

export default function Main({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isLoading = useLoadingStore((state) => state.isLoading)
  const registrationPaths = [
    "/recipes/new"
  ]
  const bgColor = isLoading || registrationPaths.some(path => pathname?.startsWith(path)) || 
    (pathname?.startsWith("/recipes/") && /^\/recipes\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(pathname || "")) ||
    (pathname?.startsWith("/admin/recipes/") && /^\/admin\/recipes\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(pathname || ""))

  if (isLoading) {
    return (
      <main className="w-full" style={{ backgroundColor: "#fff" }}>
        <div className={styles.contents_wrapper}>
          <Loading />
        </div>
      </main>
    );
  }

  return (
    <main className="w-full" style={{ backgroundColor: bgColor ? "#fff" : "inherit" }}>
      <div className={styles.contents_wrapper}>{children}</div>
    </main>
  );
}