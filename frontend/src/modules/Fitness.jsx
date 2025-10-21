import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/toast'
import { Plus, Edit, Trash2, Loader2, Dumbbell } from 'lucide-react'

export default function Fitness() {
  const [workouts, setWorkouts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [currentWorkout, setCurrentWorkout] = useState(null)
  const [workoutToDelete, setWorkoutToDelete] = useState(null)
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    note: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false)
  const [formErrors, setFormErrors] = useState({})
  const [highlightedWorkoutId, setHighlightedWorkoutId] = useState(null)
  const originalFormData = useRef({
    date: new Date().toISOString().split('T')[0],
    note: '',
  })
  const { toast } = useToast()

  useEffect(() => {
    fetchWorkouts()
  }, [])

  useEffect(() => {
    // Detect unsaved changes
    const hasChanges =
      formData.date !== originalFormData.current.date ||
      formData.note !== originalFormData.current.note
    setHasUnsavedChanges(hasChanges)
  }, [formData])

  const fetchWorkouts = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/fitness/workouts')
      if (!response.ok) throw new Error('Failed to fetch workouts')
      const data = await response.json()
      setWorkouts(data)
    } catch (error) {
      toast.error('Failed to load workouts', error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const validateForm = () => {
    const errors = {}
    if (!formData.date) {
      errors.date = 'Date is required'
    }
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      const response = currentWorkout
        ? await fetch(`/api/fitness/workouts/${currentWorkout.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData),
          })
        : await fetch('/api/fitness/workouts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData),
          })

      if (!response.ok) {
        throw new Error(currentWorkout ? 'Failed to update workout' : 'Failed to create workout')
      }

      const savedWorkout = await response.json()

      setIsDialogOpen(false)
      setFormData({
        date: new Date().toISOString().split('T')[0],
        note: '',
      })
      setCurrentWorkout(null)
      setHasUnsavedChanges(false)
      setFormErrors({})

      toast.success(
        currentWorkout ? 'Workout updated!' : 'Workout created!',
        currentWorkout ? 'Your workout has been updated successfully.' : 'Your workout has been logged successfully.'
      )

      await fetchWorkouts()

      // Highlight the new/updated workout
      if (!currentWorkout && savedWorkout.id) {
        setHighlightedWorkoutId(savedWorkout.id)
        setTimeout(() => setHighlightedWorkoutId(null), 2000)
      }
    } catch (error) {
      toast.error('Failed to save workout', error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (workout) => {
    setCurrentWorkout(workout)
    setFormData({ date: workout.date, note: workout.note || '' })
    originalFormData.current = { date: workout.date, note: workout.note || '' }
    setIsDialogOpen(true)
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/fitness/workouts/${workoutToDelete.id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Failed to delete workout')

      setIsDeleteDialogOpen(false)
      setWorkoutToDelete(null)
      toast.success('Workout deleted', 'Your workout has been deleted successfully.')
      await fetchWorkouts()
    } catch (error) {
      toast.error('Failed to delete workout', error.message)
    } finally {
      setIsDeleting(false)
    }
  }

  const openNewDialog = () => {
    setCurrentWorkout(null)
    setFormData({
      date: new Date().toISOString().split('T')[0],
      note: '',
    })
    originalFormData.current = {
      date: new Date().toISOString().split('T')[0],
      note: '',
    }
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
      setFormData({
        date: new Date().toISOString().split('T')[0],
        note: '',
      })
      setCurrentWorkout(null)
      setFormErrors({})
      setHasUnsavedChanges(false)
    }
  }

  const confirmCloseDialog = () => {
    setShowUnsavedWarning(false)
    setIsDialogOpen(false)
    setFormData({
      date: new Date().toISOString().split('T')[0],
      note: '',
    })
    setCurrentWorkout(null)
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
          <h1 className="text-3xl font-bold">Fitness</h1>
          <p className="text-muted-foreground">Log your workouts and training</p>
        </div>
        <Button onClick={openNewDialog}>
          <Plus className="mr-2 h-4 w-4" />
          New Workout
        </Button>
      </div>

      {workouts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 space-y-4">
            <Dumbbell className="h-16 w-16 text-muted-foreground opacity-50" />
            <div className="text-center space-y-2">
              <p className="text-lg font-medium">No workouts yet</p>
              <p className="text-sm text-muted-foreground">Log your first workout to start tracking your fitness journey</p>
            </div>
            <Button onClick={openNewDialog} size="lg">
              <Plus className="mr-2 h-4 w-4" />
              Log Workout
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="w-full overflow-x-auto relative">
              <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-card to-transparent pointer-events-none md:hidden" />
              <table className="w-full min-w-[480px] table-fixed">
                <thead className="border-b bg-muted/50">
                  <tr className="text-left">
                    <th className="p-4 font-semibold">Date</th>
                    <th className="p-4 font-semibold">Notes</th>
                    <th className="p-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {workouts.map((workout) => (
                    <tr
                      key={workout.id}
                      className={`border-b last:border-0 hover:bg-muted/50 transition-colors ${
                        highlightedWorkoutId === workout.id
                          ? 'bg-primary/10 animate-in fade-in duration-500'
                          : ''
                      }`}
                    >
                      <td className="p-4 font-semibold">{workout.date}</td>
                      <td className="p-4 text-muted-foreground whitespace-pre-wrap break-words">{workout.note || '—'}</td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost" onClick={() => handleEdit(workout)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setWorkoutToDelete(workout)
                              setIsDeleteDialogOpen(true)
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent onKeyDown={handleKeyDown}>
          <DialogHeader>
            <DialogTitle>{currentWorkout ? 'Edit Workout' : 'New Workout'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleFormChange('date', e.target.value)}
                  className={formErrors.date ? 'border-red-500' : ''}
                  disabled={isSubmitting}
                  autoFocus
                />
                {formErrors.date && (
                  <p className="text-sm text-red-500">{formErrors.date}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="note">Notes</Label>
                <Textarea
                  id="note"
                  value={formData.note}
                  onChange={(e) => handleFormChange('note', e.target.value)}
                  rows={8}
                  placeholder="Describe your workout..."
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
                    {currentWorkout ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  currentWorkout ? 'Update' : 'Create'
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
            <DialogTitle>Delete Workout</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete the workout from <span className="font-semibold">"{workoutToDelete?.date}"</span>? This action cannot be undone.
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
