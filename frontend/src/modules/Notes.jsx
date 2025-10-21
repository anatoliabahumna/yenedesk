import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/toast'
import { Plus, Edit, Trash2, Loader2, StickyNote } from 'lucide-react'

export default function Notes() {
  const [notes, setNotes] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [currentNote, setCurrentNote] = useState(null)
  const [noteToDelete, setNoteToDelete] = useState(null)
  const [formData, setFormData] = useState({ title: '', content: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false)
  const [formErrors, setFormErrors] = useState({})
  const [highlightedNoteId, setHighlightedNoteId] = useState(null)
  const originalFormData = useRef({ title: '', content: '' })
  const { toast } = useToast()

  useEffect(() => {
    fetchNotes()
  }, [])

  useEffect(() => {
    // Detect unsaved changes
    const hasChanges =
      formData.title !== originalFormData.current.title ||
      formData.content !== originalFormData.current.content
    setHasUnsavedChanges(hasChanges)
  }, [formData])

  const fetchNotes = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/notes')
      if (!response.ok) throw new Error('Failed to fetch notes')
      const data = await response.json()
      setNotes(data)
    } catch (error) {
      toast.error('Failed to load notes', error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const validateForm = () => {
    const errors = {}
    if (!formData.title.trim()) {
      errors.title = 'Title is required'
    } else if (formData.title.length > 100) {
      errors.title = 'Title must be less than 100 characters'
    }
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      const response = currentNote
        ? await fetch(`/api/notes/${currentNote.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData),
          })
        : await fetch('/api/notes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData),
          })

      if (!response.ok) {
        throw new Error(currentNote ? 'Failed to update note' : 'Failed to create note')
      }

      const savedNote = await response.json()

      setIsDialogOpen(false)
      setFormData({ title: '', content: '' })
      setCurrentNote(null)
      setHasUnsavedChanges(false)
      setFormErrors({})

      toast.success(
        currentNote ? 'Note updated!' : 'Note created!',
        currentNote ? 'Your note has been updated successfully.' : 'Your note has been created successfully.'
      )

      await fetchNotes()

      // Highlight the new/updated note
      if (!currentNote && savedNote.id) {
        setHighlightedNoteId(savedNote.id)
        setTimeout(() => setHighlightedNoteId(null), 2000)
      }
    } catch (error) {
      toast.error('Failed to save note', error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (note) => {
    setCurrentNote(note)
    setFormData({ title: note.title, content: note.content })
    originalFormData.current = { title: note.title, content: note.content }
    setIsDialogOpen(true)
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/notes/${noteToDelete.id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Failed to delete note')

      setIsDeleteDialogOpen(false)
      setNoteToDelete(null)
      toast.success('Note deleted', 'Your note has been deleted successfully.')
      await fetchNotes()
    } catch (error) {
      toast.error('Failed to delete note', error.message)
    } finally {
      setIsDeleting(false)
    }
  }

  const openNewDialog = () => {
    setCurrentNote(null)
    setFormData({ title: '', content: '' })
    originalFormData.current = { title: '', content: '' }
    setHasUnsavedChanges(false)
    setFormErrors({})
    setIsDialogOpen(true)
  }

  const handleDialogClose = (open) => {
    if (!open && hasUnsavedChanges) {
      setShowUnsavedWarning(true)
      return
    }
    setIsDialogOpen(open)
    if (!open) {
      setFormData({ title: '', content: '' })
      setCurrentNote(null)
      setFormErrors({})
      setHasUnsavedChanges(false)
    }
  }

  const confirmCloseDialog = () => {
    setShowUnsavedWarning(false)
    setIsDialogOpen(false)
    setFormData({ title: '', content: '' })
    setCurrentNote(null)
    setFormErrors({})
    setHasUnsavedChanges(false)
  }

  const handleFormChange = (field, value) => {
    setFormData({ ...formData, [field]: value })
    // Clear error for this field when user starts typing
    if (formErrors[field]) {
      setFormErrors({ ...formErrors, [field]: '' })
    }
  }

  // Keyboard handler for form
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      handleDialogClose(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
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

      {notes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 space-y-4">
            <StickyNote className="h-16 w-16 text-muted-foreground opacity-50" />
            <div className="text-center space-y-2">
              <p className="text-lg font-medium">No notes yet</p>
              <p className="text-sm text-muted-foreground">Create your first note to get started</p>
            </div>
            <Button onClick={openNewDialog} size="lg">
              <Plus className="mr-2 h-4 w-4" />
              Create Note
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {notes.map((note) => (
            <Card
              key={note.id}
              className={`hover:shadow-lg transition-all ${
                highlightedNoteId === note.id
                  ? 'ring-2 ring-primary animate-in fade-in duration-500'
                  : ''
              }`}
            >
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

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent onKeyDown={handleKeyDown}>
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
                  onChange={(e) => handleFormChange('title', e.target.value)}
                  className={formErrors.title ? 'border-red-500' : ''}
                  disabled={isSubmitting}
                  autoFocus
                />
                {formErrors.title && (
                  <p className="text-sm text-red-500">{formErrors.title}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => handleFormChange('content', e.target.value)}
                  rows={6}
                  disabled={isSubmitting}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleDialogClose(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {currentNote ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  currentNote ? 'Update' : 'Create'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Unsaved Changes Warning */}
      <Dialog open={showUnsavedWarning} onOpenChange={setShowUnsavedWarning}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unsaved Changes</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            You have unsaved changes. Are you sure you want to close this dialog? Your changes will be lost.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUnsavedWarning(false)}>
              Keep Editing
            </Button>
            <Button variant="destructive" onClick={confirmCloseDialog}>
              Discard Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Note</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete <span className="font-semibold">"{noteToDelete?.title}"</span>? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
