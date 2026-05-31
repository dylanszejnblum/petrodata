import type { CollectionConfig } from 'payload'

export const MailingList: CollectionConfig = {
  slug: 'mailing-list',
  access: {
    create: () => true,
    read: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
  },
  admin: {
    defaultColumns: ['email', 'source', 'createdAt'],
    useAsTitle: 'email',
  },
  fields: [
    {
      name: 'email',
      type: 'email',
      required: true,
      unique: true,
    },
    {
      name: 'source',
      type: 'select',
      options: ['newsletter-modal', 'footer', 'landing-page'],
      defaultValue: 'newsletter-modal',
    },
  ],
  timestamps: true,
}
