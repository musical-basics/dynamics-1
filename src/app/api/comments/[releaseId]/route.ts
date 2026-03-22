import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/index';
import { comments } from '@/db/schema/comments';
import { users } from '@/db/schema/users';
import { eq, desc } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';

interface Props {
  params: Promise<{ releaseId: string }>;
}

export async function GET(request: NextRequest, { params }: Props) {
  try {
    const { releaseId } = await params;

    const result = await db
      .select({
        id: comments.id,
        body: comments.body,
        timestampMs: comments.timestampMs,
        parentId: comments.parentId,
        createdAt: comments.createdAt,
        userId: comments.userId,
        displayName: users.displayName,
        avatarUrl: users.avatarUrl,
      })
      .from(comments)
      .leftJoin(users, eq(comments.userId, users.id))
      .where(eq(comments.releaseId, releaseId))
      .orderBy(desc(comments.createdAt));

    return NextResponse.json({ comments: result });
  } catch (error) {
    console.error('Comments GET error:', error);
    return NextResponse.json({ comments: [] });
  }
}

export async function POST(request: NextRequest, { params }: Props) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { releaseId } = await params;
    const { body, timestampMs, parentId } = await request.json();

    if (!body?.trim()) {
      return NextResponse.json({ error: 'Comment body required' }, { status: 400 });
    }

    const [comment] = await db.insert(comments).values({
      releaseId,
      userId: user.id,
      body: body.trim(),
      timestampMs: timestampMs ?? null,
      parentId: parentId ?? null,
    }).returning();

    return NextResponse.json({ comment });
  } catch (error) {
    console.error('Comments POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
