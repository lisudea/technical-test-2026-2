export function Container({ className = '', children, wide = false }) {
  return (
    <div
      className={`mx-auto w-full px-4 py-6 sm:px-6 sm:py-8 lg:px-10 ${
        wide ? 'max-w-screen-2xl' : 'max-w-7xl'
      } ${className}`}
    >
      {children}
    </div>
  )
}