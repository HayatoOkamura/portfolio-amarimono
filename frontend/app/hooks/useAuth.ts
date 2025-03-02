import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/app/stores/userStore";


// ログインの検査
export const useAuth = () => {
  const { user, fetchUser, isLoading } = useUserStore();
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      if (user === undefined) {
        await fetchUser();
      }

      if (!user && !isLoading) {
        router.push("/login/");
      }
    };

    checkUser();
  }, [user, fetchUser, isLoading, router]);

  return { user, isLoading };
};

