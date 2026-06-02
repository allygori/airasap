'use client';

import { use, useEffect, useState, useMemo } from 'react';
import { ProductForm } from '@/app/dashboard/products/_components/form';
import { toast } from 'sonner';
import { z } from 'zod';
import { useAppForm } from '@/components/form/form.hook';
import { useRouter } from 'next/navigation';
import { INITIAL_BLOCK_VALUE } from '../_components/form.constant';
// import { TagType } from '@/components/blog/types';
import { formSchema } from '../_components/form.schema';

type PostData = any; // You can use ZodPostSchema to infer this if preferred

const EditPostPage = ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const { id } = use(params);
  const [data, setData] = useState<PostData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`/api/posts/${id}`);
        const result = await response.json();
        if (!response.ok)
          throw new Error(
            result.message || 'Gagal mengambil data'
          );
        setData(result.data);
      } catch (err: unknown) {
        const message =
          err instanceof Error
            ? err.message
            : 'Terjadi kesalahan';
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-100 flex-1 items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="border-primary h-8 w-8 animate-spin rounded-full border-4 border-t-transparent"></div>
          <p className="text-muted-foreground animate-pulse font-medium">
            Memuat data post...
          </p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-100 flex-1 items-center justify-center">
        <div className="text-center">
          <h3 className="text-destructive text-lg font-semibold">
            Post tidak ditemukan
          </h3>
          <p className="text-muted-foreground">
            ID post mungkin salah atau telah dihapus.
          </p>
        </div>
      </div>
    );
  }

  return <EditPostFormWrapper initialData={data} id={id} />;
};

function EditPostFormWrapper({
  initialData,
  id,
}: {
  initialData: PostData;
  id: string;
}) {
  const router = useRouter();

  const formValues = useMemo(() => {
    return {
      id: initialData._id || initialData.id || '',
      title: initialData.title || '',
      slug: initialData.slug || '',
      excerpt: initialData.excerpt || '',
      body: {
        content: initialData.content || '',
        content_html: initialData.content_html || '',
        content_blocks:
          initialData.content_blocks &&
          initialData.content_blocks.length > 0
            ? initialData.content_blocks
            : INITIAL_BLOCK_VALUE,
      },
      seo: {
        metaTitle: initialData.metadata?.title || '',
        metaDescription:
          initialData.metadata?.description || '',
        keywords: '', // Assuming keywords might not exist on metadata yet, fallback to empty string
      },
      publishedStatus:
        initialData.published_status || 'published',
      publishedAt: initialData.published_at
        ? new Date(initialData.published_at).toISOString()
        : undefined,
      authorId:
        typeof initialData.author === 'object' &&
        initialData.author
          ? initialData.author._id
          : initialData.author || '',
      categoryId:
        typeof initialData.category === 'object' &&
        initialData.category
          ? initialData.category._id
          : initialData.category || '',
      tags: initialData.tags || [],
      featuredImage: initialData.featured_image || '',
    };
  }, [initialData]);

  const form = useAppForm({
    defaultValues: formValues as z.input<typeof formSchema>,
    validators: {
      onDynamic: formSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        // Map form schema back to API expected schema
        const payload = {
          title: value.title,
          slug: value.slug,
          excerpt: value.excerpt,
          content: value.body?.content,
          content_html: value.body?.content_html,
          content_blocks: value.body?.content_blocks,
          category:
            value.categoryId === ''
              ? undefined
              : value.categoryId,
          author:
            value.authorId === ''
              ? undefined
              : value.authorId,
          featured_image:
            value.featuredImage === ''
              ? undefined
              : value.featuredImage?._id,
          published_status:
            value.publishedStatus || 'published',
          published_at: value.publishedAt
            ? new Date(value.publishedAt).toISOString()
            : undefined,
          metadata: {
            title: value.seo?.metaTitle || '',
            description: value.seo?.metaDescription || '',
          },
          // Map tags
          tags: Array.isArray(value.tags)
            ? value.tags.map((t) => t._id || t)
            : [],
        };

        const response = await fetch(`/api/posts/${id}`, {
          method: 'PATCH',
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

        toast.success('Post updated successfully', {
          description: `Post "${value.title}" has been updated.`,
        });

        router.push('/dashboard/posts');
        router.refresh();
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : 'Gagal memperbarui post';
        console.error('Update post error:', error);
        toast.error(message);
      }
    },
  });

  const postTitle = form.getFieldValue('title');

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
        <div>
          <h2 className="mb-1 text-xl font-semibold">
            Edit Post
          </h2>
          <p className="text-muted-foreground text-sm font-normal">
            Ubah rincian post:{' '}
            <span className="text-foreground font-medium">
              {postTitle || initialData.title}
            </span>
          </p>
        </div>
        <ProductForm form={form} title="Informasi Post" />
      </div>
    </div>
  );
}

export default EditPostPage;
