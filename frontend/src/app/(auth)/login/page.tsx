'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { authAPI } from '@/lib/api'
import { LoginForm } from '@/components/User/login-form'
import { useNotification } from '@/hooks/useNotification'
import { setAuthToken, setCurrentUser } from '@/lib/utils/auth-utils'

type LoginData = {
  email: string
  password: string
}

export default function LoginPage() {
  const router = useRouter()
  const notify = useNotification()

  const handleLogin = async (data: LoginData) => {
    const response = await authAPI.login(data.email, data.password)
    
    if (response.success) {
      await setAuthToken(response.token)
      setCurrentUser(response.user)
      notify.success('Login Successful', 'Welcome back!', 2000)
      router.push('/dashboard')
    } else {
      const errorMsg = response.error || 'Login failed'
      notify.loginFailed(errorMsg)
      throw new Error(errorMsg)
    }
  }

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <Link href="/" className="flex items-center gap-2 font-medium">
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
            <LoginForm onSubmit={handleLogin} />
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
