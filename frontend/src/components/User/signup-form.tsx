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

type SignupData = {
  email: string
  password: string
  username: string
  confirmPassword: string
}

export function SignupForm({
  className,
  onSubmit,
  ...props
}: Omit<React.ComponentProps<"form">, "onSubmit"> & {
  onSubmit?: (data: SignupData) => Promise<void> | void
}) {
  const [formData, setFormData] = useState<SignupData>({
    email: "",
    password: "",
    username: "",
    confirmPassword: "",
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

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long")
      return
    }

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

  const googleSignup = useGoogleLogin({
    scope: "openid email profile",
    onSuccess: async (tokenResponse) => {
      setIsLoading(true)
      setError("")
      try {
        const idToken =tokenResponse.access_token
        if (!idToken) {
          setError("Google signup failed: missing Google token")
          return
        }

        const result = await handleGoogleOAuth(idToken, true)
        if (result.success) {
          router.push("/dashboard")
        } else {
          setError(result.error || "Google signup failed")
        }
      } finally {
        setIsLoading(false)
      }
    },
    onError: (error) => {
      setError("Google signup cancelled or failed")
      logger.exception(error, { where: "signup-form.googleSignup" })
    },
    flow: "implicit",
  })

  return (
    <form className={cn("flex flex-col gap-5", className)} onSubmit={handleSubmit} {...props}>
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 -mt-5 text-center">
          <h1 className="text-2xl font-bold">Create your account</h1>
          <p className="text-muted-foreground text-sm text-balance">
            Fill in the form below to create your account
          </p>
        </div>
        <Field>
          <FieldLabel htmlFor="username">Username</FieldLabel>
          <Input
            id="username"
            name="username"
            type="text"
            placeholder="johndoe"
            value={formData.username}
            onChange={handleChange}
            required
          />
        </Field>
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
      <div className="flex flex-col sm:flex-row gap-6">
  <Field className="flex-1">
    <FieldLabel htmlFor="password">Password</FieldLabel>
    <Input
      id="password"
      name="password"
      type="password"
      value={formData.password}
      onChange={handleChange}
      required
    />
    <FieldDescription>
      Must be at least 8 characters long.
    </FieldDescription>
  </Field>

  <Field className="flex-1">
    <FieldLabel htmlFor="confirmPassword">Confirm Password</FieldLabel>
    <Input
      id="confirmPassword"
      name="confirmPassword"
      type="password"
      value={formData.confirmPassword}
      onChange={handleChange}
      required
    />
    <FieldDescription>Please confirm your password.</FieldDescription>
  </Field>
</div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        <Field>
          <Button className="bg-cyan-800" type="submit" disabled={isLoading}>
            {isLoading ? "Creating..." : "Create Account"}
          </Button>
        </Field>
        <FieldSeparator>Or</FieldSeparator>
        <Field>
         <Button  
            variant="outline" 
            type="button"
            onClick={() => googleSignup()}
            disabled={isLoading}
          >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path
                      d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                     className="w-8 h-8 fill-eastern-blue-700"
                    />
                  </svg>
                  <span className="px-1">Sign up with Google</span>
                </Button>
          <FieldDescription className="px-6 text-center">
            Already have an account? <a href="/login">Sign in</a>
          </FieldDescription>
        </Field>
      </FieldGroup>
      <p className="text-center text-xs text-gray-500 max-w-2xl mx-auto mt-2">
        By creating an account, you agree to our{" "}
        <a href="/terms" className="text-cyan-600 hover:underline">Terms of Service</a>,and{" "}
        <a href="/privacy" className="text-cyan-600 hover:underline">Privacy Policy</a> 
        
      </p>
    </form>
  )
}
