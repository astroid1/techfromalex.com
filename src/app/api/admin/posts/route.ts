import { NextRequest, NextResponse } from "next/server";
import { listPostFiles, createPostFile, deletePostFile, updatePostFile, getPostFile } from "@/lib/admin/posts";
import { slugify } from "@/lib/utils";

export async function GET() {
  try {
    const posts = listPostFiles();
    return NextResponse.json(posts.map(({ raw, ...rest }) => rest));
  } catch (error) {
    return NextResponse.json({ error: "Failed to list posts" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, category, tags, image, imageAlt, author, published, content } = body;

    if (!title || !description) {
      return NextResponse.json({ error: "Title and description are required" }, { status: 400 });
    }

    const slug = slugify(title);
    const date = new Date().toISOString().split("T")[0];

    createPostFile(slug, {
      title,
      description,
      date,
      category: category || "reviews",
      tags: tags || [],
      image: image || "",
      imageAlt: imageAlt || title,
      author: author || "Alex",
      published: published ?? false,
      hasAffiliateLinks: false,
      affiliateProducts: [],
    }, content || "## Introduction\n\nStart writing here...");

    return NextResponse.json({ success: true, slug });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create post";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { slug, frontmatter, content } = body;

    if (!slug) {
      return NextResponse.json({ error: "Slug is required" }, { status: 400 });
    }

    const existing = getPostFile(slug);
    if (!existing) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    updatePostFile(slug, {
      ...existing.frontmatter,
      ...frontmatter,
    }, content ?? existing.content);

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update post";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { slug } = await request.json();

    if (!slug) {
      return NextResponse.json({ error: "Slug is required" }, { status: 400 });
    }

    deletePostFile(slug);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete post";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
