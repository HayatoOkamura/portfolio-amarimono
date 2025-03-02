import styles from "@/app/styles/Main.module.scss"

export default function Main({ children }: { children: React.ReactNode }) {
  return (
    <main className="w-full">
      <div className={styles.contents_wrapper}>{children}</div>
    </main>
  );
}