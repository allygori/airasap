'use client';

import { z } from 'zod';
import Image from 'next/image';
import { withForm } from '@/components/form/form.hook';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { FieldGroup } from '@/components/ui/field';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ImagePlus, X } from 'lucide-react';
import { INITIAL_BLOCK_VALUE } from './form.constant';
import { formSchema } from './form.schema';

type ProductFormProps = {
  title?: string;
};

export const ProductForm = withForm({
  defaultValues: {
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
    publishedStatus: 'published',
    publishedAt: undefined,
    authorId: '',
    categoryId: '',
    tags: [],
    featuredImage: '',
  } as z.input<typeof formSchema>,
  props: {
    title: undefined,
  } as ProductFormProps,
  render: function Render({ form, title }) {
    return (
      <form
        id="post-form"
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
        className="flex flex-col items-start gap-6 lg:flex-row"
      >
        {/* LEFT COLUMN: MAIN CONTENT */}
        <div className="flex w-full flex-1 flex-col gap-6">
          {/* Title */}
          <FieldGroup>
            <form.AppField
              name="title"
              children={(field) => {
                return (
                  <field.TextField
                    label="Title"
                    autoComplete="off"
                    onChange={(e) => {
                      field.handleChange(e.target.value);
                      // Auto-generate slug if it's empty
                      if (!form.getFieldValue('slug')) {
                        form.setFieldValue(
                          'slug',
                          e.target.value
                            .toLowerCase()
                            .replace(/[\s_]+/g, '-')
                            .replace(/[^\w-]+/g, '')
                        );
                      }
                    }}
                    className="h-10 text-xl font-normal shadow-none focus-visible:bg-transparent focus-visible:ring-0 md:text-lg"
                  />
                );
              }}
            />
          </FieldGroup>

          {/* Excerpt */}
          <FieldGroup>
            <form.AppField
              name="excerpt"
              children={(field) => (
                <field.TextareaField
                  label="Excerpt"
                  description="Used for blog previews and summaries."
                  className="min-h-24 resize-y"
                  rows={5}
                />
              )}
            />
          </FieldGroup>

          {/* TABS: Content, Metadata, SEO */}
          <Tabs defaultValue="content" className="w-full">
            <TabsList variant="line" className="mb-4">
              <TabsTrigger value="content">
                Content
              </TabsTrigger>
              <TabsTrigger value="metadata">
                Metadata
              </TabsTrigger>
              <TabsTrigger value="seo">SEO</TabsTrigger>
            </TabsList>

            <TabsContent
              value="content"
              className="flex flex-col gap-6"
            >
              <p>Description</p>
            </TabsContent>

            <TabsContent
              value="metadata"
              className="flex flex-col gap-6"
            >
              <Card className="border-border/50 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">
                    Metadata
                  </CardTitle>
                  <CardDescription>
                    Configure classification and authorship.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FieldGroup className="flex flex-col gap-6">
                    <form.AppField
                      name="slug"
                      children={(field) => {
                        return (
                          <field.TextField
                            label="URL Slug"
                            disabled={true}
                            // InputProps={{
                            //   // Assuming support for Shadcn input groups via a wrapper, otherwise TextField directly handles it
                            // }}
                          />
                        );
                      }}
                    />

                    <form.AppField
                      name="categoryId"
                      children={(field) => (
                        <field.SelectField
                          label="Category"
                          remote={{
                            url: '/api/categories/search',
                            resultsKey: 'data',
                            labelKey: 'name', // Field to use as label
                            valueKey: '_id', // Field to use as value
                            searchParam: 'q', // Query param for searching
                            limit: 5,
                          }}
                        />
                      )}
                    />

                    <form.AppField
                      name="tags"
                      children={(field) => (
                        // Using Textfield for now until proper Tags multi-select is available
                        <field.MultiselectField
                          label="Tags"
                          description="Max tags: 3"
                          remote={{
                            url: '/api/tags',
                            resultsKey: 'data',
                            labelKey: 'name', // Field to use as label
                            valueKey: '_id', // Field to use as value
                            searchParam: 'q', // Query param for searching
                            limit: 5,
                          }}
                        />
                      )}
                    />

                    <form.AppField
                      name="authorId"
                      children={(field) => (
                        <field.SelectField
                          label="Author"
                          remote={{
                            url: '/api/users',
                            resultsKey: 'data',
                            labelKey: 'name', // Field to use as label
                            valueKey: '_id', // Field to use as value
                            searchParam: 'q', // Query param for searching
                            limit: 5,
                          }}
                        />
                      )}
                    />
                  </FieldGroup>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent
              value="seo"
              className="flex flex-col gap-6"
            >
              <Card className="border-border/50 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">
                    Search Engine Optimization
                  </CardTitle>
                  <CardDescription>
                    Configure how this post will appear in
                    search results.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FieldGroup className="flex flex-col gap-6">
                    <form.AppField
                      name="seo.metaTitle"
                      children={(field) => (
                        <field.TextField
                          label="Meta Title"
                          placeholder="SEO Title (leave empty to use post title)"
                        />
                      )}
                    />
                    <form.AppField
                      name="seo.metaDescription"
                      children={(field) => (
                        <field.TextareaField
                          label="Meta Description"
                          placeholder="A concise description for search engines..."
                          rows={3}
                        />
                      )}
                    />
                    <form.AppField
                      name="seo.keywords"
                      children={(field) => (
                        <field.TextField
                          label="Keywords"
                          placeholder="react, cms, nextjs"
                        />
                      )}
                    />
                  </FieldGroup>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* <div className={"item bordered overflow-hidden"}>
            <pre className="text-sm text-wrap wrap-break-word whitespace-pre-wrap">
              <code>{JSON.stringify(form.store.state.values, null, 2)}</code>
            </pre>
          </div> */}
        </div>

        {/* RIGHT COLUMN: SIDEBAR */}
        <div className="flex w-full shrink-0 flex-col gap-6 lg:sticky lg:top-8 lg:w-80">
          <FieldGroup className="flex flex-col gap-6">
            <form.AppField
              name="publishedAt"
              children={(field) => (
                <field.DateTimeField label="Publish Date" />
              )}
            />

            <form.AppForm>
              <form.SubmitButton text="Save" />
            </form.AppForm>
          </FieldGroup>
        </div>
      </form>
    );
  },
});

// export default PostForm;
