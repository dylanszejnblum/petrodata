'use client'

import React, { useEffect, useId, useRef, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import type { ChartBlock as ChartBlockProps } from '@/payload-types'
import { cn } from '@/utilities/ui'

type Props = ChartBlockProps & {
  className?: string
}

const MERMAID_THEME_VARIABLES = {
  background: '#0a0a0a',
  primaryColor: '#1a1a1a',
  primaryTextColor: '#e8e8e8',
  primaryBorderColor: '#333333',
  lineColor: '#666666',
  secondaryColor: '#1a1a1a',
  tertiaryColor: '#111111',
  fontSize: '13px',
} as const

function MermaidChart({ source, instanceId }: { source: string; instanceId: string }) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const render = async () => {
      try {
        const mermaid = (await import('mermaid')).default
        mermaid.initialize({
          startOnLoad: false,
          theme: 'dark',
          themeVariables: MERMAID_THEME_VARIABLES,
          securityLevel: 'strict',
          fontFamily: 'var(--font-plus-jakarta), system-ui, sans-serif',
        })
        const { svg } = await mermaid.render(`mermaid-${instanceId}`, source.trim())
        if (!cancelled && containerRef.current) {
          containerRef.current.innerHTML = svg
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to render diagram')
        }
      }
    }

    render()
    return () => {
      cancelled = true
    }
  }, [source, instanceId])

  if (error) {
    return (
      <div className="rounded-lg border border-nd-border bg-nd-surface p-4 text-xs text-nd-text-secondary">
        Diagram failed to render: {error}
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="flex w-full justify-center overflow-x-auto [&_svg]:max-w-full [&_svg]:h-auto"
    />
  )
}

type BarRow = { label: string; value: number; highlight?: boolean | null }

function formatBarValue(value: number, yLabel?: string | null): string {
  if (yLabel?.toLowerCase().includes('usd')) {
    if (Math.abs(value) >= 1) return `$${value.toFixed(2)}B`
    return `$${(value * 1000).toFixed(0)}M`
  }

  if (Math.abs(value) >= 1000) {
    return new Intl.NumberFormat('en-US', {
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value)
  }

  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: value < 1 ? 3 : 1,
  }).format(value)
}

function formatBarValueUnknown(value: unknown, yLabel?: string | null): string {
  return formatBarValue(typeof value === 'number' ? value : 0, yLabel)
}

function BarChartView({ data, yLabel }: { data: BarRow[]; yLabel?: string | null }) {
  const accent = 'var(--nd-accent)'
  const muted = 'var(--nd-border-visible)'
  const isHorizontal = data.some((row) => row.label.length > 14)
  const chartHeight = Math.max(320, data.length * (isHorizontal ? 54 : 42))

  return (
    <div className="w-full" style={{ height: chartHeight }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout={isHorizontal ? 'vertical' : 'horizontal'}
          margin={isHorizontal ? { top: 8, right: 30, left: 72, bottom: 8 } : { top: 16, right: 16, left: 8, bottom: 48 }}
        >
          <CartesianGrid stroke="var(--nd-border)" strokeDasharray="3 3" vertical={false} />
          {isHorizontal ? (
            <>
              <XAxis
                type="number"
                tickFormatter={(value: number) => formatBarValue(value, yLabel)}
                tick={{
                  fill: 'var(--nd-text-secondary)',
                  fontSize: 11,
                  fontFamily: 'var(--font-space-mono)',
                }}
                tickLine={{ stroke: 'var(--nd-border)' }}
                axisLine={{ stroke: 'var(--nd-border)' }}
              />
              <YAxis
                type="category"
                dataKey="label"
                width={120}
                tick={{
                  fill: 'var(--nd-text-secondary)',
                  fontSize: 11,
                  fontFamily: 'var(--font-space-mono)',
                }}
                tickLine={false}
                axisLine={false}
              />
            </>
          ) : (
            <>
              <XAxis
                dataKey="label"
                tick={{
                  fill: 'var(--nd-text-secondary)',
                  fontSize: 11,
                  fontFamily: 'var(--font-space-mono)',
                }}
                tickLine={{ stroke: 'var(--nd-border)' }}
                axisLine={{ stroke: 'var(--nd-border)' }}
                interval={0}
                angle={-15}
                textAnchor="end"
                height={56}
              />
              <YAxis
                tickFormatter={(value: number) => formatBarValue(value, yLabel)}
                tick={{
                  fill: 'var(--nd-text-secondary)',
                  fontSize: 11,
                  fontFamily: 'var(--font-space-mono)',
                }}
                tickLine={{ stroke: 'var(--nd-border)' }}
                axisLine={{ stroke: 'var(--nd-border)' }}
                label={
                  yLabel
                    ? {
                        value: yLabel,
                        angle: -90,
                        position: 'insideLeft',
                        fill: 'var(--nd-text-secondary)',
                        fontSize: 11,
                        fontFamily: 'var(--font-space-mono)',
                      }
                    : undefined
                }
              />
            </>
          )}
          <Tooltip
            cursor={{ fill: 'var(--nd-accent-subtle)' }}
            contentStyle={{
              background: 'var(--nd-surface-raised)',
              border: '1px solid var(--nd-border-visible)',
              borderRadius: 8,
              fontFamily: 'var(--font-space-mono)',
              fontSize: 12,
              color: 'var(--nd-text-display)',
            }}
            labelStyle={{ color: 'var(--nd-text-secondary)' }}
            formatter={(value) => [formatBarValueUnknown(value, yLabel), yLabel || 'Value']}
          />
          <Bar dataKey="value" radius={isHorizontal ? [0, 6, 6, 0] : [6, 6, 0, 0]}>
            {data.map((row, i) => (
              <Cell key={i} fill={row.highlight ? accent : muted} />
            ))}
            <LabelList
              dataKey="value"
              position={isHorizontal ? 'right' : 'top'}
              formatter={(value) => formatBarValueUnknown(value, yLabel)}
              style={{
                fill: 'var(--nd-text-secondary)',
                fontSize: 10,
                fontFamily: 'var(--font-space-mono)',
              }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export const ChartClient: React.FC<Props> = ({
  chartType,
  title,
  caption,
  mermaidSource,
  barData,
  yLabel,
  className,
}) => {
  const id = useId().replace(/:/g, '')

  return (
    <figure
      className={cn(
        'not-prose my-10 w-full rounded-2xl border border-nd-border bg-nd-surface p-5 md:p-7',
        className,
      )}
    >
      {title ? (
        <figcaption
          className="mb-4 text-[11px] uppercase tracking-wider text-nd-text-secondary font-mono"
        >
          {title}
        </figcaption>
      ) : null}
      {chartType === 'mermaid' && mermaidSource ? (
        <MermaidChart source={mermaidSource} instanceId={id} />
      ) : null}
      {chartType === 'bar' && barData && barData.length > 0 ? (
        <BarChartView
          data={barData.map((d) => ({
            label: d.label,
            value: d.value,
            highlight: d.highlight ?? false,
          }))}
          yLabel={yLabel}
        />
      ) : null}
      {caption ? (
        <p
          className="mt-4 text-xs leading-5 text-nd-text-secondary font-sans"
        >
          {caption}
        </p>
      ) : null}
    </figure>
  )
}
