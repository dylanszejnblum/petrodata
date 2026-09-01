/* Layout raíz pass-through: el <html> lo monta el layout de [locale] para que
   lang salga del locale de la URL (patrón documentado de next-intl con
   i18n routing). globals.css y las fuentes se cargan allá. */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children
}
