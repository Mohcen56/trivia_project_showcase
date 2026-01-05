import { cn } from "@/lib/utils/utils"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { useGoogleLogin } from "@react-oauth/google"
import { handleGoogleOAuth } from "@/lib/utils/google-oauth"
import { useRouter } from "next/navigation"
import { logger } from "@/lib/utils/logger"

type LoginData = {
  email: string
  password: string
}

export function LoginForm({
  className,
  onSubmit,
  ...props
}: Omit<React.ComponentProps<"form">, "onSubmit"> & {
  onSubmit?: (data: LoginData) => Promise<void> | void
}) {
  const [formData, setFormData] = useState<LoginData>({
    email: "",
    password: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((s) => ({ ...s, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)
    try {
      if (onSubmit) await onSubmit(formData)
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else if (typeof err === "string") {
        setError(err)
      } else {
        setError("An error occurred")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const googleLogin = useGoogleLogin({
    scope: "openid email profile",
    onSuccess: async (tokenResponse) => {
      setIsLoading(true)
      setError("")
      try {
        const idToken =tokenResponse.access_token
        if (!idToken) {
          setError("Google login failed: missing Google token")
          return
        }

        const result = await handleGoogleOAuth(idToken, false)
        if (result.success) {
          router.push("/dashboard")
        } else {
          setError(result.error || "Google login failed")
        }
      } finally {
        setIsLoading(false)
      }
    },
    onError: (error) => {
      setError("Google login cancelled or failed")
      logger.exception(error, { where: "login-form.googleLogin" })
    },
    flow: "implicit",
  })

  return (
    <form className={cn("flex flex-col gap-6", className)} onSubmit={handleSubmit} {...props}>
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Login to your account</h1>
          <p className="text-muted-foreground text-sm text-balance">
            Enter your email below to login to your account
          </p>
        </div>
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-center text-black text-sm">
            {error}
          </div>
        )}
        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="m@example.com"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </Field>
        <Field>
          <div className="flex items-center">
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <a
              href="/ForgotPassword"
              className="ml-auto text-sm underline-offset-4 hover:underline"
            >
              Forgot your password?
            </a>
          </div>
          <Input
            id="password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </Field>
        <Field>
          <Button className="bg-cyan-800" type="submit" disabled={isLoading}>
            {isLoading ? "Logging in..." : "Login"}
          </Button>
        </Field>
        <FieldSeparator>Or </FieldSeparator>
        <Field>
          <Button 
            variant="outline" 
            type="button"
            onClick={() => googleLogin()}
            disabled={isLoading}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
              <path
                d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                className="w-8 h-8 fill-cyan-700"
              />
            </svg>
            <span className="px-1">Sign in with Google</span>
          </Button>
          <FieldDescription className="text-center">
            Don&apos;t have an account?{" "}
            <a href="/signup" className="underline underline-offset-4">
              Sign up
            </a>
          </FieldDescription>
        </Field>
      </FieldGroup>
      <p className="text-center text-xs text-gray-500 max-w-2xl mx-auto mt-4">
        By logging in, you agree to our{" "}
        <a href="/terms" className="text-cyan-600 hover:underline">Terms of Service</a>,{" "}
        <a href="/privacy" className="text-cyan-600 hover:underline">Privacy Policy</a>, and{" "}
        <a href="/refund" className="text-cyan-600 hover:underline">Refund Policy</a>.
      </p>
    </form>
  )
}
