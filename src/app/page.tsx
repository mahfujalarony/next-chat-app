import Link from "next/link";
import Head from "next/head";
export default function Home() {
  return (
    <div>
      <Head>
        <title>Home Page</title>
      </Head>
      home page

      {/* link to about page */}

      <Link href="/register/step1" className="text-blue-500 hover:underline">Go to Register</Link>
      <br />
      <Link href="/signin" className="text-blue-500">Sign In</Link>
      <br />
      <Link href="/about" className="text-blue-500">About</Link>
    </div>
  );
}
