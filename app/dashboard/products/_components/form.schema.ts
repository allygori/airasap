import z from 'zod';

// Ensure Zod handles the complex content object
const BlockContentSchema = z.object({
  content: z.string().optional(),
  content_html: z.string().optional(),
  content_blocks: z.any().optional(),
});

export const formSchema = z.object({
  id: z.string(),
  title: z.string().min(1, 'Title is required'),
  slug: z.string().min(1, 'Slug is required'),
  excerpt: z.string().optional(),
  body: BlockContentSchema.optional(), // we will bind the TextEditor to this field
  seo: z
    .object({
      metaTitle: z.string().optional(),
      metaDescription: z.string().optional(),
      keywords: z.string().optional(),
    })
    .optional(),
  publishedStatus: z.string().optional(),
  publishedAt: z.string().optional(),
  authorId: z.string().optional(),
  categoryId: z.string().optional(),
  tags: z
    .array(z.any())
    .max(3, 'Max 3 tags allowed')
    .optional(),
  featuredImage: z.any().optional(),
});
