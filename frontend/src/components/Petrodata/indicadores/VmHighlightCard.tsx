import Image from 'next/image'
import { getLocale, getTranslations } from 'next-intl/server'
import { formatDecimal } from '@/utilities/formatNumber'

/** Photo tile beside the day-value card: what Vaca Muerta is inside the country. */
export async function VmHighlightCard({
  oilSharePct,
  gasSharePct,
  wells,
}: {
  oilSharePct: number | null
  gasSharePct: number | null
  wells: number | null
}) {
  const t = await getTranslations('indicadores.vmCard')
  const locale = await getLocale()

  return (
    <div className="relative flex min-h-56 flex-col justify-end overflow-hidden rounded-[10px] border border-nd-border bg-[#16191d]">
      <Image
        src="/images/vm-rig.jpg"
        alt=""
        fill
        sizes="(min-width: 1024px) 40vw, 100vw"
        className="object-cover object-[center_42%] grayscale contrast-[1.05]"
      />
      <span aria-hidden className="absolute inset-0 bg-black/50" />

      <div className="absolute left-4 top-4 flex items-center gap-2">
        <span
          className="size-1.5 rounded-full"
          style={{ background: '#3fb883', boxShadow: '0 0 6px 1px rgba(63,184,131,0.65)' }}
          aria-hidden
        />
        <span className="text-[9px] font-medium uppercase tracking-[0.15em] text-white/75 font-mono">
          {t('label')}
        </span>
      </div>

      <div className="relative p-4">
        <h3 className="text-xl font-semibold leading-tight tracking-[-0.01em] text-white font-display">
          {t('title')}
        </h3>
        <div className="mt-3 flex items-end justify-between gap-3">
          <dl className="flex gap-5">
            {oilSharePct != null && (
              <Figure value={`${formatDecimal(oilSharePct, locale, 1)}%`} label={t('oilShare')} />
            )}
            {gasSharePct != null && (
              <Figure value={`${formatDecimal(gasSharePct, locale, 1)}%`} label={t('gasShare')} accent />
            )}
            {wells != null && (
              <Figure value={wells.toLocaleString('es-AR')} label={t('wells')} />
            )}
          </dl>
        </div>
      </div>
    </div>
  )
}

function Figure({ value, label, accent }: { value: string; label: string; accent?: boolean }) {
  return (
    <div>
      <dd
        className="text-base font-semibold leading-none tabular-nums font-display"
        style={{ color: accent ? '#3fb883' : '#fff' }}
      >
        {value}
      </dd>
      <dt className="mt-1 text-[8px] font-medium uppercase tracking-[0.12em] text-white/70 font-mono">
        {label}
      </dt>
    </div>
  )
}
