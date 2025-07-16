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

  // ページタイトルを動的に設定
  const getPageTitle = () => {
    if (pathname === "/") return "レシピ検索ページ";
    if (pathname.startsWith("/recipes")) return "レシピ一覧・詳細ページ";
    if (pathname.startsWith("/user")) return "ユーザーページ";
    if (pathname.startsWith("/admin")) return "管理ページ";
    if (pathname.startsWith("/help")) return "ヘルプページ";
    return "ページ";
  };

  if (isLoading) {
    return (
      <main 
        className="w-full" 
        style={{ backgroundColor: "#fff" }}
        aria-label="ページ読み込み中"
        aria-live="polite"
      >
        <div className={styles.contents_wrapper}>
          <Loading />
        </div>
      </main>
    );
  }

  return (
    <main 
      className="w-full" 
      style={{ backgroundColor: bgColor }}
      aria-label={getPageTitle()}
    >
      <div className={styles.contents_wrapper}>{children}</div>
    </main>
  );
}