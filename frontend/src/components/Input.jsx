"use client"

/**
 * A reusable, styled input component with HBlast design consistency.
 */
function Input({ placeholder, value, onChange, type = "text", className = "", disabled = false, ...props }) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={`
        w-full
        rounded-xl
        border-2
        border-[#2a3441]/50
        bg-gradient-to-r
        from-[#1f152b]
        to-[#0f051d]
        p-4
        text-white
        placeholder-[#b7b4bb]
        transition-all
        duration-200
        focus:border-[#9351f7]
        focus:outline-none
        focus:ring-2
        focus:ring-[#9351f7]/30
        focus:shadow-lg
        focus:shadow-[#9351f7]/20
        hover:border-[#9351f7]/70
        disabled:opacity-50
        disabled:cursor-not-allowed
        disabled:hover:border-[#2a3441]/50
        ${className}
      `}
      {...props}
    />
  )
}

export default Input