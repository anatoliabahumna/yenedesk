import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Edit, Trash2, Loader2 } from 'lucide-react'
import { request } from '@/lib/api'
import { useToast } from '@/components/ui/toast.jsx'

export default function Notes() {
  const [notes, setNotes] = useState([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [currentNote, setCurrentNote] = useState(null)
  const [noteToDelete, setNoteToDelete] = useState(null)
  const [formData, setFormData] = useState({ title: '', content: '' })
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const toast = useToast()

  useEffect(() => {
    fetchNotes()
  }, [])

  const fetchNotes = async ({ silent = false } = {}) => {
    if (!silent) {
      setIsLoading(true)
      setLoadError(null)
    }
    try {
      const data = await request('/api/notes')
      setNotes(Array.isArray(data) ? data : [])
    } catch (error) {
      if (!silent) {
        setLoadError(error.message || 'Failed to load notes')
      }
      toast({
        title: 'Failed to load notes',
        description: error.message,
        variant: 'error',
      })
    } finally {
      if (!silent) {
        setIsLoading(false)
      }
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (currentNote) {
        await request(`/api/notes/${currentNote.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })
        toast({ title: 'Note updated', description: 'Your changes have been saved.', variant: 'success' })
      } else {
        await request('/api/notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })
        toast({ title: 'Note created', description: 'A new note has been added.', variant: 'success' })
      }
      setIsDialogOpen(false)
      setFormData({ title: '', content: '' })
      setCurrentNote(null)
      fetchNotes({ silent: true })
    } catch (error) {
      toast({
        title: currentNote ? 'Unable to update note' : 'Unable to create note',
        description: error.message,
        variant: 'error',
      })
    }
  }

  const handleEdit = (note) => {
    setCurrentNote(note)
    setFormData({ title: note.title, content: note.content })
    setIsDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!noteToDelete) return
    try {
      await request(`/api/notes/${noteToDelete.id}`, { method: 'DELETE' })
      toast({ title: 'Note deleted', description: 'The note has been removed.', variant: 'success' })
      setIsDeleteDialogOpen(false)
      setNoteToDelete(null)
      fetchNotes({ silent: true })
    } catch (error) {
      toast({
        title: 'Unable to delete note',
        description: error.message,
        variant: 'error',
      })
    }
  }

  const openNewDialog = () => {
    setCurrentNote(null)
    setFormData({ title: '', content: '' })
    setIsDialogOpen(true)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Notes</h1>
          <p className="text-muted-foreground">Capture and organize your thoughts</p>
        </div>
        <Button onClick={openNewDialog}>
          <Plus className="mr-2 h-4 w-4" />
          New Note
        </Button>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-hidden="true" />
            <p className="text-sm text-muted-foreground">Loading your notes…</p>
          </CardContent>
        </Card>
      ) : loadError ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-center">
            <p className="text-sm text-muted-foreground">{loadError}</p>
            <Button onClick={() => fetchNotes()} variant="outline">
              Try again
            </Button>
          </CardContent>
        </Card>
      ) : notes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <p className="text-muted-foreground">No notes yet. Create your first note!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {notes.map((note) => (
            <Card key={note.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg">{note.title}</CardTitle>
                <CardDescription className="line-clamp-2">{note.content}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleEdit(note)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setNoteToDelete(note)
                      setIsDeleteDialogOpen(true)
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent onClose={() => setIsDialogOpen(false)}>
          <DialogHeader>
            <DialogTitle>{currentNote ? 'Edit Note' : 'New Note'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={6}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">{currentNote ? 'Update' : 'Create'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent onClose={() => setIsDeleteDialogOpen(false)}>
          <DialogHeader>
            <DialogTitle>Delete Note</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete "{noteToDelete?.title}"? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

