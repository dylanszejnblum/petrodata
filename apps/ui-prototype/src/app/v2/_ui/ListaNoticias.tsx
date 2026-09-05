'use client'

import { useMemo, useState } from 'react'
import { FilaNoticia } from './kit'
import { Icono, PATH } from './iconos'

/* LISTA DE NOTICIAS — buscador, píldoras de categoría y la lista.

   Es la misma Filter Table (§13) con el buscador de la §15 que ya usa la lista
   de empresas. Que sean la misma pieza importa: dos formas distintas de
   «filtrá esta lista» en la misma web es una de más.

   Lo que arregla respecto de lo que había —una lista plana de veinte filas—:

   · Las categorías se ven con su ETIQUETA y no con su clave. La lista mostraba
     «financiamiento», «exportacion» y «rigi», en minúscula y sin acentos.
     CATEGORY_LABEL vive en el mismo fixture, se usa en toda la ruta v1 y en v2
     no se usaba en ningún lado.

   · Los conteos por tema pasan a las píldoras. Antes eran una sección aparte
     —«Cobertura de la cuenca»— con chips que decían un número y no hacían
     nada. Un conteo al lado de un filtro sí sirve: dice cuánto vas a ver.

   · Las píldoras salen de FILTER_CATEGORIES, que es la declaración del propio
     fixture de cuáles son filtrables, y también estaba sin usar. Las tres que
     quedan afuera —actualidad, laboral, ambiente— se alcanzan por el buscador,
     y el pie lo dice.

   No hay orden por relevancia, que el sitio sí tiene. No hay ninguna señal de
   relevancia en el fixture y inventar un puntaje sería exactamente lo que se
   viene sacando de esta página. */

export type FilaNota = {
  id: string
  titulo: string
  resumen: string
  fuente: string
  fecha: string
  /** clave de la categoría: manda color, foto y filtro */
  cat: string
  /** etiqueta legible */
  rot: string
  minutos?: number
  imagen?: string
}

export function ListaNoticias({
  notas,
  pills,
}: {
  notas: FilaNota[]
  /** las categorías filtrables, con su etiqueta, en el orden del fixture */
  pills: { id: string; rot: string }[]
}) {
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('todas')

  const conteo = useMemo(() => {
    const m: Record<string, number> = { todas: notas.length }
    for (const n of notas) m[n.cat] = (m[n.cat] ?? 0) + 1
    return m
  }, [notas])

  /* El filtrado es por texto plano sin acentos: buscar «produccion» tiene que
     encontrar «producción», que es justamente el problema que tenía la página
     al mostrar las claves crudas. */
  const plano = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  const filtradas = useMemo(() => {
    const t = plano(q.trim())
    return notas.filter(
      (n) =>
        (cat === 'todas' || n.cat === cat) &&
        (!t || plano(`${n.titulo} ${n.resumen} ${n.fuente} ${n.rot}`).includes(t)),
    )
  }, [notas, q, cat])

  const visibles = new Set(filtradas.map((n) => n.id))

  return (
    <div>
      <div className="s-card mb-2">
        <div className="s-busca">
          <span className="shrink-0" style={{ color: 'var(--ink-3)' }}>
            <Icono d={PATH.buscar} size={14} grosor={2} />
          </span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar en el título, el resumen o la fuente…"
            aria-label="Buscar una noticia"
          />
          {q && (
            <button
              type="button"
              className="s-icono shrink-0"
              style={{ width: 22, height: 22 }}
              onClick={() => setQ('')}
              aria-label="Limpiar la búsqueda"
            >
              <Icono d={PATH.cerrar} size={12} grosor={2} />
            </button>
          )}
        </div>
      </div>

      <div className="s-filtros s-filtros--envuelve" role="group" aria-label="Filtrar por tema">
        <button
          type="button"
          className="s-fpill"
          aria-pressed={cat === 'todas'}
          onClick={() => setCat('todas')}
        >
          Todas
          <b>{conteo.todas}</b>
        </button>
        {pills.map((p) => (
          <button
            key={p.id}
            type="button"
            className="s-fpill"
            aria-pressed={cat === p.id}
            onClick={() => setCat(p.id)}
            /* Las que no tienen ninguna nota se deshabilitan en vez de
               esconderse: un filtro que aparece y desaparece según el corpus
               es una barra que cambia de forma sola. */
            disabled={!conteo[p.id]}
            style={!conteo[p.id] ? { opacity: 0.45, cursor: 'default' } : undefined}
          >
            {p.rot}
            <b>{conteo[p.id] ?? 0}</b>
          </button>
        ))}
      </div>

      <div className="s-card">
        {/* Las filas que salen del filtro se COLAPSAN, no desaparecen de un
            frame al otro: es la única animación estructural del sistema
            —grid-template-rows de 1fr a 0fr— y la misma que usa la lista de
            empresas. Van todas montadas siempre para que el colapso tenga de
            dónde animar. */}
        {notas.map((n) => (
          <div key={n.id} className="s-colapsa" data-abierto={visibles.has(n.id) ? 'si' : 'no'}>
            <div>
              <FilaNoticia
                id={n.id}
                href={`/v2/noticias/${n.id}`}
                titulo={n.titulo}
                resumen={n.resumen}
                fuente={n.fuente}
                fecha={n.fecha}
                categoria={n.cat}
                rotulo={n.rot}
                minutos={n.minutos}
                imagen={n.imagen}
              />
            </div>
          </div>
        ))}
        {/* El vacío no se esconde: si no hay resultados, la card lo dice en el
            renglón que ocuparía una fila. */}
        {filtradas.length === 0 && (
          <p className="s-etq m-0 px-3 py-6 text-center">
            No hay notas que coincidan con «{q}».
          </p>
        )}
      </div>
    </div>
  )
}
