"use client";

import { useState, useTransition } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FileText, Plus, Trash2, Loader2, Edit2, Tag, Search } from "lucide-react";
import { toast } from "sonner";
import { createNote, updateNote, deleteNote } from "./actions";
import type { Note } from "@/types";
import { useLanguage } from "@/components/providers/language-provider";
import { getDateFnsLocale } from "@/lib/i18n/date-locale";

function NoteCard({ note }: { note: Note }) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content ?? "");
  const [tagsStr, setTagsStr] = useState(note.tags.join(", "));
  const [isPending, startTransition] = useTransition();
  const [isDeleting, startDelete] = useTransition();
  const { t, locale } = useLanguage();

  function handleSave() {
    const tags = tagsStr.split(",").map((tg) => tg.trim()).filter(Boolean);
    startTransition(async () => {
      try {
        await updateNote(note.id, title, content, tags);
        toast.success(t.notes.saved);
        setIsEditing(false);
      } catch { toast.error(t.notes.couldNotSave); }
    });
  }

  function handleDelete() {
    startDelete(async () => {
      try {
        await deleteNote(note.id);
        toast.success(t.notes.deleted);
      } catch { toast.error(t.notes.couldNotSave); }
    });
  }

  return (
    <Card className="border-0 shadow-sm hover:shadow-md transition-shadow group">
      <CardHeader className="pb-2 flex-row items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground truncate">{note.title}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {formatDistanceToNow(new Date(note.updated_at), {
              addSuffix: true,
              locale: getDateFnsLocale(locale),
            })}
            {" · "}
            {format(new Date(note.updated_at), "d MMM yyyy", { locale: getDateFnsLocale(locale) })}
          </p>
        </div>
        <div className="flex gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
          <Dialog open={isEditing} onOpenChange={setIsEditing}>
            <DialogTrigger render={<Button variant="ghost" size="icon" className="w-7 h-7 text-muted-foreground hover:text-foreground" />}>
              <Edit2 className="w-3 h-3" />
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>{t.notes.editNote}</DialogTitle></DialogHeader>
              <div className="space-y-4 mt-2">
                <div className="space-y-1">
                  <Label>{t.notes.titleField}</Label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>{t.notes.content}</Label>
                  <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={8} className="resize-none font-mono text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="flex items-center gap-1"><Tag className="w-3 h-3" /> {t.notes.tags}</Label>
                  <Input value={tagsStr} onChange={(e) => setTagsStr(e.target.value)} placeholder={t.notes.tagsPlaceholder} />
                </div>
                <Button onClick={handleSave} disabled={isPending} className="w-full bg-rose-500 hover:bg-rose-600 text-white">
                  {isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  {t.notes.saveNote}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Button variant="ghost" size="icon" className="w-7 h-7 text-muted-foreground/50 hover:text-red-400 hover:bg-red-500/10" disabled={isDeleting} onClick={handleDelete}>
            {isDeleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {note.content && <p className="text-sm text-muted-foreground line-clamp-4 whitespace-pre-wrap">{note.content}</p>}
        {note.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {note.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs border-0 bg-muted text-muted-foreground">{tag}</Badge>
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
  const { t } = useLanguage();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        await createNote(formData);
        toast.success(t.notes.created);
        setOpen(false);
      } catch (err) { toast.error((err as Error).message); }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button id="new-note-trigger" className="bg-rose-500 hover:bg-rose-600 text-white gap-2" />}>
        <Plus className="w-4 h-4" />{t.notes.newNote}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{t.notes.createNote}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1">
            <Label htmlFor="title">{t.notes.titleField}</Label>
            <Input id="title" name="title" placeholder={t.notes.noteTitlePlaceholder} required />
          </div>
          <div className="space-y-1">
            <Label htmlFor="content">{t.notes.content}</Label>
            <Textarea id="content" name="content" placeholder={t.notes.contentPlaceholder} rows={8} className="resize-none" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="tags" className="flex items-center gap-1"><Tag className="w-3 h-3" /> {t.notes.tags}</Label>
            <Input id="tags" name="tags" placeholder={t.notes.tagsPlaceholder} />
          </div>
          <Button type="submit" disabled={isPending} className="w-full bg-rose-500 hover:bg-rose-600 text-white">
            {isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            {t.notes.createNote}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function NotesGrid({ notes }: { notes: Note[] }) {
  const [search, setSearch] = useState("");
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const { t } = useLanguage();

  const allTags = Array.from(new Set(notes.flatMap((n) => n.tags)));
  const filtered = notes.filter((n) => {
    const matchesSearch = !search || n.title.toLowerCase().includes(search.toLowerCase()) || (n.content ?? "").toLowerCase().includes(search.toLowerCase());
    const matchesTag = !filterTag || n.tags.includes(filterTag);
    return matchesSearch && matchesTag;
  });

  return (
    <div className="space-y-6">
      <div id="notes-toolbar" className="flex items-center gap-3 flex-wrap scroll-mt-24">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder={t.notes.searchPlaceholder} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <NewNoteDialog />
      </div>

      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setFilterTag(null)} className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${!filterTag ? "bg-rose-500 text-white" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
            {t.notes.all}
          </button>
          {allTags.map((tag) => (
            <button key={tag} onClick={() => setFilterTag(filterTag === tag ? null : tag)}
              className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${filterTag === tag ? "bg-rose-500 text-white" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
              {tag}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground space-y-4">
          <FileText className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p>{search || filterTag ? t.notes.noMatch : t.notes.empty}</p>
          {!search && !filterTag && notes.length === 0 && (
            <Button
              type="button"
              className="bg-rose-500 hover:bg-rose-600 text-white"
              onClick={() => document.getElementById("new-note-trigger")?.click()}
            >
              {t.notes.addFirstCta}
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((note) => <NoteCard key={note.id} note={note} />)}
        </div>
      )}
    </div>
  );
}
