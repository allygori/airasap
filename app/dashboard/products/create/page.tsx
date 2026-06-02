'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { z } from 'zod';
import { revalidateLogic } from '@tanstack/react-form';

import { useAppForm } from '@/components/form/form.hook';
import { ProductForm } from '@/app/dashboard/products/_components/form';
// import { TagType } from '@/components/blog/types';
import { INITIAL_BLOCK_VALUE } from '../_components/form.constant';
import { formSchema } from '../_components/form.schema';

const defaultValues: z.input<typeof formSchema> = {
  id: '',
  title: '',
  slug: '',
  excerpt: '',
  body: {
    content: '',
    content_html: '',
    content_blocks: INITIAL_BLOCK_VALUE,
  },
  seo: {
    metaTitle: '',
    metaDescription: '',
    keywords: '',
  },
  publishedAt: undefined,
  authorId: '',
  categoryId: '',
  tags: [],
  featuredImage: '',
};

const CreatePage = () => {
  const router = useRouter();

  const form = useAppForm({
    defaultValues,
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: formSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        const payload = {
          title: value.title,
          slug: value.slug || undefined,
          excerpt: value.excerpt,
          content: value.body?.content,
          content_html: value.body?.content_html,
          content_blocks: value.body?.content_blocks,
          category:
            value.categoryId === ''
              ? undefined
              : value.categoryId,
          featured_image:
            value.featuredImage === '' &&
            !!value.featuredImage?._id
              ? undefined
              : value.featuredImage._id,
          published_status:
            value.publishedStatus || 'published',
          published_at: value.publishedAt
            ? new Date(value.publishedAt).toISOString()
            : undefined,
          metadata: {
            title: value.seo?.metaTitle || '',
            description: value.seo?.metaDescription || '',
          },
          tags: Array.isArray(value.tags)
            ? value.tags.map((t) => t._id || t)
            : [],
        };

        const response = await fetch('/api/posts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.message ||
              result.error?.message ||
              'Terjadi kesalahan saat menyimpan post'
          );
        }

        toast.success('Post saved successfully', {
          description: `Post "${value.title}" has been saved.`,
        });

        router.push('/dashboard/posts');
        router.refresh();
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : 'Gagal menyimpan post';
        console.error('Create post error:', error);
        toast.error(message);
      }
    },
  });

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
        <div>
          <h2 className="mb-1 font-semibold">
            Create New Post
          </h2>
          <p className="text-muted-foreground text-sm font-normal">
            Draft a new post for your blog.
          </p>
        </div>
        <ProductForm form={form} />
      </div>
    </div>
  );
};

export default CreatePage;
