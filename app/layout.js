import "./globals.css";

export const metadata = {
  title: "ABC University - Academic Management",
  description: "CouchDB-backed academic management (23 relations)",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <header className="topbar">
          <a href="/" className="brand">
            ABC University
          </a>
          <span className="sub">Integrated Academic Management</span>
        </header>
        <main className="wrap">{children}</main>
      </body>
    </html>
  );
}
