// components/StepGuard.tsx
"use client";
import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function StepGuard({ requiredStep, children }: { requiredStep: number, children: React.ReactNode }) {
  const step = useSelector((state: any) => state.register.step);
  const router = useRouter();

  useEffect(() => {
    if (step < requiredStep) {
      router.push("/register/step" + step); 
    }
  }, [step]);

  return <>{children}</>;
}
