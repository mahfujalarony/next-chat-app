"use client";


// Step1Form.jsx
import { useDispatch } from "react-redux";
import { setStep1 } from "@/lib/redux/features/registerSlice";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Step1Form() {
  const dispatch = useDispatch();
  const router = useRouter();

  const handleNext = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const firstName = e.currentTarget.firstName.value;
    const lastName = e.currentTarget.lastName.value;

    dispatch(setStep1({ firstName, lastName }));
    // Redirect to Step 2
    router.push("/register/step2");
  };

  return (
    <form onSubmit={handleNext}>
      <input name="firstName" placeholder="First Name" />
      <input name="lastName" placeholder="Last Name" />
      <button type="submit">Next</button>
   
    </form>
  );
}
