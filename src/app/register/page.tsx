"use client";

import React from 'react'
import { useRouter } from 'next/navigation'

const page: React.FC = () => {
  const router = useRouter();

  return (
    <div>
      <h1>Register</h1>
      <p>Please fill in the details below to create an account.</p>
      <button
      className='bg-blue-500 text-white px-4 py-2 rounded'
      onClick={() => router.push('/register/step1')}>Next</button>
    </div>
  )
}

export default page
