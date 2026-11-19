import "./globals.css";

export const metadata = {
  title: {
    default: "Ploy Support Desk",
    template: "%s | Ploy Support Desk",
  },
  description:
    "A simple support ticket system for recording and managing customer complaints.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
