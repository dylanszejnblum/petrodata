import { formatDateTime } from 'src/utilities/formatDateTime'
import React from 'react'

import type { Post } from '@/payload-types'

import { Media } from '@/components/Media'
import { formatAuthors } from '@/utilities/formatAuthors'

export const PostHero: React.FC<{
  post: Post
}> = ({ post }) => {
  const { categories, heroImage, populatedAuthors, publishedAt, title } = post

  const hasAuthors =
    populatedAuthors && populatedAuthors.length > 0 && formatAuthors(populatedAuthors) !== ''

  return (
    <section className="container pt-12 md:pt-16">
      <div className="mb-8 max-w-4xl">
        <div className="mb-5 flex flex-wrap gap-2">
          {categories?.map((category, index) => {
            if (typeof category === 'object' && category !== null) {
              const { title: categoryTitle } = category
              const titleToUse = categoryTitle || 'Uncategorized'
              return (
                <span
                  key={`${titleToUse}-${index}`}
                  className="border border-nd-border px-2 py-1 text-[10px] uppercase text-nd-text-secondary"
                  style={{ fontFamily: 'var(--font-space-mono)' }}
                >
                  {titleToUse}
                </span>
              )
            }
            return null
          })}
        </div>

        <h1
          className="mb-6 text-balance text-4xl leading-none text-nd-text-display md:text-6xl"
          style={{ fontFamily: 'Doto, var(--font-space-grotesk)' }}
        >
          {title}
        </h1>

        <div className="flex flex-col gap-4 border-t border-nd-border pt-5 text-sm md:flex-row md:gap-16">
          {hasAuthors && (
            <div className="flex flex-col gap-1">
              <p
                className="text-[11px] uppercase text-nd-text-disabled"
                style={{ fontFamily: 'var(--font-space-mono)' }}
              >
                Author
              </p>
              <p
                className="text-nd-text-secondary"
                style={{ fontFamily: 'var(--font-space-grotesk)' }}
              >
                {formatAuthors(populatedAuthors)}
              </p>
            </div>
          )}
          {publishedAt && (
            <div className="flex flex-col gap-1">
              <p
                className="text-[11px] uppercase text-nd-text-disabled"
                style={{ fontFamily: 'var(--font-space-mono)' }}
              >
                Published
              </p>
              <time
                className="text-nd-text-secondary tabular-nums"
                dateTime={publishedAt}
                style={{ fontFamily: 'var(--font-space-grotesk)' }}
              >
                {formatDateTime(publishedAt)}
              </time>
            </div>
          )}
        </div>
      </div>

      <div className="relative aspect-[16/9] overflow-hidden rounded-[2rem] border border-nd-border bg-nd-surface-raised">
        {heroImage && typeof heroImage !== 'string' ? (
          <Media
            fill
            priority
            imgClassName="object-cover"
            pictureClassName="size-full"
            resource={heroImage}
            size="100vw"
          />
        ) : null}
        <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/35 via-transparent to-transparent" />
      </div>
    </section>
  )
}
