import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="mx-auto grid max-w-[80rem] place-items-center px-4 py-24 md:px-8">
      <div className="w-full max-w-[30rem] rounded-[10px] border bg-surface p-8 text-center">
        <p className="type-kpi text-[3rem]">404</p>
        <p className="mt-2 text-secondary">Esta página no existe o fue movida.</p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-[8px] bg-primary px-4 py-2 text-[13px] font-medium text-canvas"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  )
}
