'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { authAPI } from '@/lib/api/index';
import { SignupForm } from '@/components/User/signup-form';
import { useNotification } from '@/hooks/useNotification';
import { setAuthToken, setCurrentUser } from '@/lib/utils/auth-utils';

type SignupData = {
  email: string;
  password: string;
  username: string;
  confirmPassword: string;
};

export default function SignupPage() {
  const router = useRouter();
  const notify = useNotification();

  const handleSignup = async (data: SignupData) => {
    const response = await authAPI.register({
      email: data.email,
      password: data.password,
      username: data.username,
    });
    
    if (response?.success) {
      await setAuthToken(response.token);
      setCurrentUser(response.user);
      notify.accountVerified();
      router.push('/dashboard');
    } else {
      const errorMsg = response?.error || 'Signup failed';
      notify.error('Signup Failed', errorMsg);
      throw new Error(errorMsg);
    }
  };

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6">
        <div className="flex justify-center gap-2 md:justify-start">
          <Link href="/" className=" flex items-center  gap-2 font-medium">
            <Image
              src="/logo/mylogo.svg"
              alt="Trivia Spirit Logo"
              width={40}
              height={40}
              className="w-15 h-15"
            />
          
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-lg">
            <SignupForm onSubmit={handleSignup} />
          </div>
        </div>
      </div>
      <div className="bg-cyan-800 relative hidden lg:block">
        <Image
          src="/logo/logo3.svg"
          alt="Trivia Spirit"
          fill
          className="absolute inset-0 object-cover dark:brightness-[0.2] dark:grayscale"
          sizes="(min-width: 1024px) 50vw, 100vw"
          priority
        />
      </div>
    </div>
  )
}
