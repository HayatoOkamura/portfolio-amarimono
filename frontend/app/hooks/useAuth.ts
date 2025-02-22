import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/app/stores/userStore";

export const useAuth = () => {
  const { user, fetchUser } = useUserStore();
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      if (user === undefined) {
        await fetchUser();
      }

      if (user === undefined) {
        router.push("/login/"); // ユーザー情報が取得できていない場合にリダイレクト
      }
    };

    checkUser();
  }, [user, fetchUser, router]);

  return { user };
};
