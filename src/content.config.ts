import { glob } from "astro/loaders";
import { defineCollection } from "astro:content";
import { z } from "astro/zod";

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/blog' }),
  schema: z.object({
    title: z.string(),
    pubDate: z.date(),
    description: z.string(),
    tags: z.array(z.string()),
    draft: z.boolean().optional().default(false),
  })
});

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/projects' }),
  schema: z.object({
    name: z.string(),
    description: z.string(),
    tech: z.array(z.string()),
    github: z.string().optional(),
    demo: z.string().optional(),
    order: z.number(),
  })
});

export const collections = { blog, projects };
