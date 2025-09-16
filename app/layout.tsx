export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        style={{
          backgroundColor: '#2f2f98ff', // couleur de fond globale
          color: '#e5e7eb',           // couleur du texte par défaut (lisible sur fond sombre)
          margin: 0,
          minHeight: '100dvh',
        }}
      >
        {children}
      </body>
    </html>
  );
}