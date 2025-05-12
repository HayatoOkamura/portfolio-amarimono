// app/components/ui/Link/CustomLink.tsx
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";
import Loading from "../Loading/Loading";

interface CustomLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

export const CustomLink = ({ href, children, className }: CustomLinkProps) => {
  const [isNavigating, setIsNavigating] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // ページ遷移の完了を検知
  useEffect(() => {
    if (isNavigating) {
      setIsNavigating(false);
    }
  }, [pathname, isNavigating]);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsNavigating(true);
    router.push(href);
  };

  return (
    <>
      <Link
        href={href}
        onClick={handleClick}
        prefetch
        onMouseEnter={() => router.prefetch(href)}
        className={className}
      >
        {children}
      </Link>
      {isNavigating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white bg-opacity-80">
          <Loading />
        </div>
      )}
    </>
  );
};
