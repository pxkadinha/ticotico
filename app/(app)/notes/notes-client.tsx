"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  FileText,
  Plus,
  Trash2,
  Loader2,
  Edit2,
  Tag,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { createNote, updateNote, deleteNote } from "./actions";
import type { Note } from "@/types";

function NoteCard({ note }: { note: Note }) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content ?? "");
  const [tagsStr, setTagsStr] = useState(note.tags.join(", "));
  const [isPending, startTransition] = useTransition();
  const [isDeleting, startDelete] = useTransition();

  function handleSave() {
    const tags = tagsStr
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    startTransition(async () => {
      try {
        await updateNote(note.id, title, content, tags);
        toast.success("Note saved");
        setIsEditing(false);
      } catch {
        toast.error("Could not save note");
      }
    });
  }

  function handleDelete() {
    startDelete(async () => {
      try {
        await deleteNote(note.id);
        toast.success("Note deleted");
      } catch {
        toast.error("Could not delete note");
      }
    });
  }

  return (
    <Card className="border-0 shadow-sm hover:shadow-md transition-shadow group">
      <CardHeader className="pb-2 flex-row items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-800 truncate">{note.title}</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            {format(new Date(note.updated_at), "MMM d, yyyy")}
          </p>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Dialog open={isEditing} onOpenChange={setIsEditing}>
            <DialogTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-7 h-7 text-gray-400 hover:text-gray-600"
                />
              }
            >
              <Edit2 className="w-3 h-3" />
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Edit note</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <div className="space-y-1">
                  <Label>Title</Label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Content</Label>
                  <Textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={8}
                    className="resize-none font-mono text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="flex items-center gap-1">
                    <Tag className="w-3 h-3" /> Tags (comma separated)
                  </Label>
                  <Input
                    value={tagsStr}
                    onChange={(e) => setTagsStr(e.target.value)}
                    placeholder="family, health, important"
                  />
                </div>
                <Button
                  onClick={handleSave}
                  disabled={isPending}
                  className="w-full bg-rose-500 hover:bg-rose-600 text-white"
                >
                  {isPending && (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  )}
                  Save note
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Button
            variant="ghost"
            size="icon"
            className="w-7 h-7 text-gray-300 hover:text-red-400 hover:bg-red-50"
            disabled={isDeleting}
            onClick={handleDelete}
          >
            {isDeleting ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Trash2 className="w-3 h-3" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {note.content && (
          <p className="text-sm text-gray-600 line-clamp-4 whitespace-pre-wrap">
            {note.content}
          </p>
        )}
        {note.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {note.tags.map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="text-xs border-0 bg-gray-100 text-gray-600"
              >
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function NewNoteDialog() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        await createNote(formData);
        toast.success("Note created");
        setOpen(false);
      } catch (err) {
        toast.error((err as Error).message);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button className="bg-rose-500 hover:bg-rose-600 text-white gap-2" />
        }
      >
        <Plus className="w-4 h-4" />
        New note
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create note</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1">
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" placeholder="Note title" required />
          </div>
          <div className="space-y-1">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              name="content"
              placeholder="Write your note here..."
              rows={8}
              className="resize-none"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="tags" className="flex items-center gap-1">
              <Tag className="w-3 h-3" /> Tags (comma separated)
            </Label>
            <Input
              id="tags"
              name="tags"
              placeholder="family, health, important"
            />
          </div>
          <Button
            type="submit"
            disabled={isPending}
            className="w-full bg-rose-500 hover:bg-rose-600 text-white"
          >
            {isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            Create note
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function NotesGrid({ notes }: { notes: Note[] }) {
  const [search, setSearch] = useState("");
  const [filterTag, setFilterTag] = useState<string | null>(null);

  const allTags = Array.from(new Set(notes.flatMap((n) => n.tags)));

  const filtered = notes.filter((n) => {
    const matchesSearch =
      !search ||
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      (n.content ?? "").toLowerCase().includes(search.toLowerCase());
    const matchesTag = !filterTag || n.tags.includes(filterTag);
    return matchesSearch && matchesTag;
  });

  return (
    <div className="space-y-6">
      {/* Header actions */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <NewNoteDialog />
      </div>

      {/* Tag filter */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilterTag(null)}
            className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
              !filterTag
                ? "bg-rose-500 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            All
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setFilterTag(filterTag === tag ? null : tag)}
              className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
                filterTag === tag
                  ? "bg-rose-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* Notes grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <FileText className="w-12 h-12 mx-auto mb-4 text-gray-200" />
          <p>
            {search || filterTag
              ? "No notes match your search."
              : "No notes yet. Create your first one!"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((note) => (
            <NoteCard key={note.id} note={note} />
          ))}
        </div>
      )}
    </div>
  );
}
