import { Fragment } from 'react'
import type { NewsAttachment } from '@/api/news'
import { NewsHighlight } from './NewsHighlight'

/**
 * Renders a plain-text news body as paragraphs, injecting a large highlighted
 * pull-quote after the opening paragraph and trailing image figures.
 */
export function NewsBody({
  text,
  highlight,
  highlightLabel,
  images,
}: {
  text: string
  highlight: string | null
  highlightLabel?: string
  images: NewsAttachment[]
}) {
  const paragraphs = text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)

  // Single-block bodies still get the highlight, rendered after the text.
  const inlineAfter = paragraphs.length > 1 ? 0 : -1

  return (
    <div className="mt-8 flex flex-col gap-5 text-base leading-relaxed text-nd-text-display font-sans">
      {paragraphs.map((p, i) => (
        <Fragment key={i}>
          <p className="whitespace-pre-line">{p}</p>
          {highlight && i === inlineAfter ? (
            <NewsHighlight label={highlightLabel}>{highlight}</NewsHighlight>
          ) : null}
        </Fragment>
      ))}

      {highlight && inlineAfter === -1 ? (
        <NewsHighlight label={highlightLabel}>{highlight}</NewsHighlight>
      ) : null}

      {images.map((img, i) => (
        <figure key={`${img.url}-${i}`} className="my-2">
          {/* External, arbitrary source URLs — plain img avoids next/image domain config. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={img.url}
            alt={img.title || ''}
            loading="lazy"
            className="w-full border border-nd-border bg-nd-surface object-cover"
          />
          {img.title ? (
            <figcaption className="mt-2 font-mono text-[11px] text-nd-text-disabled">
              {img.title}
            </figcaption>
          ) : null}
        </figure>
      ))}
    </div>
  )
}
