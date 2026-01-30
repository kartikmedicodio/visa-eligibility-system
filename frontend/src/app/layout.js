import './globals.css'

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <title>Visa Eligibility System</title>
        <meta name="description" content="AI-powered Visa Eligibility Determination System" />
      </head>
      <body>{children}</body>
    </html>
  )
}

