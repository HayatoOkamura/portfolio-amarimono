import styles from "@/app/styles/Main.module.scss"
import { usePathname } from "next/navigation"
import useLoadingStore from "./stores/loadingStore"
import Loading from "./components/ui/Loading/Loading"
import { useMemo } from "react"

export default function Main({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isLoading = useLoadingStore((state) => state.isLoading)

  const bgColor = useMemo(() => {
    // UUID形式のIDにマッチするパターン
    const uuidPattern = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
    
    const RecipeDetail = [
      new RegExp(`^/recipes/${uuidPattern}$`),           // /recipes/[uuid]
      new RegExp(`^/user/recipes/${uuidPattern}$`),       // /user/recipes/[uuid]
      new RegExp(`^/admin/recipes/${uuidPattern}$`),    // /admin/recipes/[uuid]
    ];

    // パターンに一致するかチェック
    return RecipeDetail.some(pattern => pattern.test(pathname)) 
      ? "#fff" 
      : "inherit";
  }, [pathname]);

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
    <main className="w-full" style={{ backgroundColor: bgColor }}>
      <div className={styles.contents_wrapper}>{children}</div>
    </main>
  );
}