import type { Block } from 'payload'

export const Chart: Block = {
  slug: 'chart',
  interfaceName: 'ChartBlock',
  fields: [
    {
      name: 'chartType',
      type: 'select',
      required: true,
      defaultValue: 'mermaid',
      options: [
        { label: 'Mermaid (flowchart, timeline, mindmap)', value: 'mermaid' },
        { label: 'Bar chart (Recharts)', value: 'bar' },
      ],
    },
    {
      name: 'title',
      type: 'text',
    },
    {
      name: 'caption',
      type: 'textarea',
    },
    {
      name: 'mermaidSource',
      type: 'code',
      label: 'Mermaid source',
      admin: {
        language: 'markdown',
        condition: (_data, sibling) => sibling?.chartType === 'mermaid',
      },
    },
    {
      name: 'barData',
      type: 'array',
      label: 'Bar chart rows',
      admin: {
        condition: (_data, sibling) => sibling?.chartType === 'bar',
      },
      fields: [
        { name: 'label', type: 'text', required: true },
        { name: 'value', type: 'number', required: true },
        { name: 'highlight', type: 'checkbox', defaultValue: false },
      ],
    },
    {
      name: 'yLabel',
      type: 'text',
      admin: {
        condition: (_data, sibling) => sibling?.chartType === 'bar',
      },
    },
  ],
}
