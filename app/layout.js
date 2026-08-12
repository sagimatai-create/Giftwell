import "./globals.css";

export const metadata = {
  title: "Giftwell",
  description: "Wishlists you can actually share.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
