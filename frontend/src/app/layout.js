import './globals.css'

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <head>
        <title>Visa Eligibility System</title>
        <meta name="description" content="AI-powered Visa Eligibility Determination System" />
      </head>
      <body className="bg-dark-bg text-white antialiased">{children}</body>
    </html>
  )
}

