import { Link } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'

export default function NotFound() {
  const t = useTranslations('v2.notFound')
  return (
    <div className="mx-auto grid max-w-[42rem] place-items-center px-4 py-24">
      <div className="w-full max-w-[30rem] text-center">
        <p className="s-mono text-[3rem]" style={{ color: 'var(--ink)' }}>
          404
        </p>
        <p className="s-desc mt-2">{t('titulo')}</p>
        <Link href="/" className="s-pill mt-6">
          {t('volver')} <span aria-hidden>→</span>
        </Link>
      </div>
    </div>
  )
}
