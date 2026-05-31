'use client'
import { cn } from '@/utilities/ui'
import useClickableCard from '@/utilities/useClickableCard'
import { formatDateTime } from '@/utilities/formatDateTime'
import Link from 'next/link'
import React from 'react'

import type { Post } from '@/payload-types'

import { Media } from '@/components/Media'

export type CardPostData = Pick<
  Post,
  'slug' | 'categories' | 'heroImage' | 'meta' | 'publishedAt' | 'title'
>

export const Card: React.FC<{
  alignItems?: 'center'
  className?: string
  doc?: CardPostData
  relationTo?: 'posts'
  showCategories?: boolean
  title?: string
}> = (props) => {
  const { card, link } = useClickableCard({})
  const { className, doc, relationTo, showCategories, title: titleFromProps } = props

  const { slug, categories, heroImage, meta, publishedAt, title } = doc || {}
  const { description, image: metaImage } = meta || {}

  const hasCategories = categories && Array.isArray(categories) && categories.length > 0
  const titleToUse = titleFromProps || title
  const sanitizedDescription = description?.replace(/\s/g, ' ')
  const href = `/${relationTo}/${slug}`
  const imageToUse =
    heroImage && typeof heroImage === 'object'
      ? heroImage
      : metaImage && typeof metaImage === 'object'
        ? metaImage
        : null
  const publishedLabel = publishedAt
    ? formatDateTime(publishedAt)
    : null
  const categoriesToShow = hasCategories
    ? categories
        ?.filter((category): category is NonNullable<typeof category> & { title?: string } => {
          return typeof category === 'object' && category !== null
        })
        .slice(0, 2)
    : []

  return (
    <article
      className={cn(
        'group rounded-[2rem] border border-nd-border bg-nd-surface p-4 transition-colors hover:bg-nd-surface-raised',
        className,
      )}
      ref={card.ref}
    >
      <Link href={href} ref={link.ref} className="block">
        <div className="relative mb-6 aspect-[16/10] overflow-hidden rounded-3xl border border-nd-border bg-nd-surface-raised">
          {imageToUse ? (
            <Media
              resource={imageToUse}
              fill
              priority={false}
              pictureClassName="size-full"
              imgClassName="object-cover transition-transform duration-200 ease-out group-hover:scale-[1.02]"
              size="(max-width: 768px) 100vw, 33vw"
            />
          ) : (
            <div className="flex size-full items-end justify-start bg-nd-surface-raised p-5">
              <span
                className="text-nd-text-disabled text-[11px] uppercase"
                style={{ fontFamily: 'var(--font-space-mono)' }}
              >
                No cover available
              </span>
            </div>
          )}
        </div>

        <div className="px-2 pb-2">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {showCategories && categoriesToShow.length > 0 && (
              <>
                {categoriesToShow.map((category, index) => (
                  <span
                    key={`${category.title || 'category'}-${index}`}
                    className="border border-nd-border px-2 py-1 text-[10px] uppercase text-nd-text-secondary"
                    style={{ fontFamily: 'var(--font-space-mono)' }}
                  >
                    {category.title || 'Uncategorized'}
                  </span>
                ))}
              </>
            )}
            {publishedLabel && (
              <time
                className="text-[11px] text-nd-text-disabled tabular-nums"
                dateTime={publishedAt || undefined}
                style={{ fontFamily: 'var(--font-space-mono)' }}
              >
                {publishedLabel}
              </time>
            )}
          </div>

          {titleToUse && (
            <h3
              className="mb-3 text-balance text-2xl leading-tight text-nd-text-display md:text-[2rem]"
              style={{
                fontFamily: 'Doto, var(--font-space-grotesk)',
              }}
            >
              {titleToUse}
            </h3>
          )}

          {description && (
            <p
              className="line-clamp-2 text-pretty text-sm leading-6 text-nd-text-secondary"
              style={{ fontFamily: 'var(--font-space-grotesk)' }}
            >
              {sanitizedDescription}
            </p>
          )}
        </div>
      </Link>
    </article>
  )
}
