import * as React from "react"
import { OTPInput, OTPInputContext } from "input-otp"

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ")
}

function InputOTP({
  className,
  containerClassName,
  ...props
}: React.ComponentProps<typeof OTPInput> & {
  containerClassName?: string
}) {
  return (
    <OTPInput
      data-slot="input-otp"
      containerClassName={cn(
        "flex items-center gap-2 has-disabled:opacity-50",
        containerClassName
      )}
      className={cn("disabled:cursor-not-allowed", className)}
      {...props}
    />
  )
}

function InputOTPGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="input-otp-group"
      className={cn("flex items-center", className)}
      {...props}
    />
  )
}

function InputOTPSlot({
  index,
  masked = false,
  className,
  ...props
}: React.ComponentProps<"div"> & {
  index: number
  masked?: boolean
}) {
  const inputOTPContext = React.useContext(OTPInputContext)
  const { char, hasFakeCaret, isActive } = inputOTPContext?.slots[index] ?? {}

  return (
    <div
      data-slot="input-otp-slot"
      data-active={isActive}
      className={cn(
        "data-[active=true]:border-accent data-[active=true]:bg-accent-soft data-[active=true]:ring-accent/40 aria-invalid:border-destructive data-[active=true]:aria-invalid:border-destructive bg-bg border-border relative flex h-12 w-10 items-center justify-center border-y border-r text-lg shadow-sm shadow-black/10 transition-[border-color,background-color,box-shadow] duration-150 ease-out outline-none first:rounded-l-lg first:border-l last:rounded-r-lg data-[active=true]:z-10 data-[active=true]:ring-[3px] text-text font-bold",
        className
      )}
      {...props}
    >
      {masked && char ? "•" : char}
      {hasFakeCaret && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="animate-caret-blink bg-accent h-4 w-px duration-1000" />
        </div>
      )}
    </div>
  )
}

export { InputOTP, InputOTPGroup, InputOTPSlot }
