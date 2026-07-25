import "./globals.css";

export const metadata = {
  title: "Smart Email Builder",
  description: "AI-powered, RAG-based client email generator",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
