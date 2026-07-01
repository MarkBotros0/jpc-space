"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNowStrict } from "date-fns";
import { Lock, MessagesSquare, Send, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/ui/empty-state";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { RichTextView } from "@/components/ui/rich-text-view";
import { countWords } from "@/lib/forum";
import {
  submitForumPostAction,
  addForumCommentAction,
  deleteForumCommentAction,
} from "@/lib/forum-actions";
import type { ForumPostView, ForumViewData } from "@/lib/forum-query";

export interface ForumViewProps {
  data: ForumViewData;
  currentUserId: number;
}

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

function PersonAvatar({ name, url }: { name: string; url: string | null }) {
  return (
    <Avatar className="size-9">
      {url && <AvatarImage src={url} alt={name} />}
      <AvatarFallback>{initialsFor(name)}</AvatarFallback>
    </Avatar>
  );
}

export function ForumView({ data, currentUserId }: ForumViewProps) {
  const router = useRouter();
  const [text, setText] = React.useState(data.ownText);
  const [error, setError] = React.useState<string | null>(null);
  const [info, setInfo] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  const min = data.minWords ?? 0;
  const words = countWords(text);
  const meetsMin = words >= min;
  const hasPosted = data.ownStatus !== "DRAFT";

  function submit() {
    setError(null);
    setInfo(null);
    startTransition(async () => {
      const result = await submitForumPostAction(data.ownSubmissionId, text);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setInfo(hasPosted ? "Response updated." : "Posted!");
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Compose your response */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Your response</CardTitle>
          {hasPosted && <Badge variant="success">Posted</Badge>}
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <RichTextEditor
            value={text}
            onChange={setText}
            placeholder="Share your thoughts…"
          />
          <div className="flex items-center justify-between text-xs">
            <span
              className={
                meetsMin ? "text-success-700 dark:text-success-300" : "text-muted-foreground"
              }
            >
              {words} {words === 1 ? "word" : "words"}
              {min > 0 && ` · minimum ${min}`}
            </span>
          </div>

          {error && (
            <p className="rounded-md bg-error-50 px-3 py-2 text-sm text-error-800">{error}</p>
          )}
          {info && (
            <p className="rounded-md bg-success-50 px-3 py-2 text-sm text-success-800">{info}</p>
          )}

          <div className="flex justify-end">
            <Button type="button" onClick={submit} disabled={pending || !meetsMin}>
              {pending ? "Posting…" : hasPosted ? "Update response" : "Post response"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Group discussion */}
      {data.locked ? (
        <EmptyState
          icon={Lock}
          title="Post to unlock the discussion"
          description="Share your own response first to see what your group-mates wrote."
        />
      ) : data.posts.length === 0 ? (
        <EmptyState
          icon={MessagesSquare}
          title="No responses yet"
          description="You're the first in your group to post. Check back soon."
        />
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
            Group discussion · {data.posts.length}
          </p>
          {data.posts.map((post) => (
            <ForumPostCard
              key={post.submissionId}
              post={post}
              allowComments={data.allowComments}
              currentUserId={currentUserId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ForumPostCard({
  post,
  allowComments,
  currentUserId,
}: {
  post: ForumPostView;
  allowComments: boolean;
  currentUserId: number;
}) {
  const router = useRouter();
  const [body, setBody] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  function addComment() {
    setError(null);
    startTransition(async () => {
      const result = await addForumCommentAction(post.submissionId, body);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setBody("");
      router.refresh();
    });
  }

  function removeComment(commentId: number) {
    startTransition(async () => {
      const result = await deleteForumCommentAction(commentId);
      if (!result.ok) setError(result.error);
      else router.refresh();
    });
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 pt-6">
        <div className="flex items-center gap-2.5">
          <PersonAvatar name={post.authorName} url={post.authorAvatarUrl} />
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-foreground">{post.authorName}</span>
            {post.submittedAt && (
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNowStrict(post.submittedAt)} ago
              </span>
            )}
          </div>
        </div>

        <RichTextView html={post.text} emptyText="No written response." />

        {allowComments && (
          <div className="flex flex-col gap-3 border-t border-border pt-3">
            {post.comments.map((c) => (
              <div key={c.id} className="flex items-start gap-2.5">
                <PersonAvatar name={c.authorName} url={c.authorAvatarUrl} />
                <div className="flex flex-1 flex-col rounded-lg bg-muted/50 px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-foreground">{c.authorName}</span>
                    <span className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground">
                        {formatDistanceToNowStrict(c.createdAt)} ago
                      </span>
                      {c.authorUserId === currentUserId && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => removeComment(c.id)}
                          disabled={pending}
                          aria-label="Delete comment"
                        >
                          <Trash2 />
                        </Button>
                      )}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap text-sm text-foreground">{c.body}</p>
                </div>
              </div>
            ))}

            <div className="flex items-end gap-2">
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write a comment…"
                rows={1}
                className="min-h-10"
                disabled={pending}
              />
              <Button
                type="button"
                size="icon"
                onClick={addComment}
                disabled={pending || body.trim() === ""}
                aria-label="Post comment"
              >
                <Send />
              </Button>
            </div>
            {error && <p className="text-xs text-error-700">{error}</p>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
