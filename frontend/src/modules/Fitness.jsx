import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Edit, Trash2, Loader2 } from 'lucide-react'
import { request } from '@/lib/api'
import { useToast } from '@/components/ui/toast.jsx'

export default function Fitness() {
  const [workouts, setWorkouts] = useState([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [currentWorkout, setCurrentWorkout] = useState(null)
  const [workoutToDelete, setWorkoutToDelete] = useState(null)
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    note: '',
  })
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const toast = useToast()

  useEffect(() => {
    fetchWorkouts()
  }, [])

  const fetchWorkouts = async ({ silent = false } = {}) => {
    if (!silent) {
      setIsLoading(true)
      setLoadError(null)
    }
    try {
      const data = await request('/api/fitness/workouts')
      setWorkouts(Array.isArray(data) ? data : [])
    } catch (error) {
      if (!silent) {
        setLoadError(error.message || 'Failed to load workouts')
      }
      toast({
        title: 'Unable to load workouts',
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
      if (currentWorkout) {
        await request(`/api/fitness/workouts/${currentWorkout.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })
        toast({ title: 'Workout updated', description: 'Your workout has been updated.', variant: 'success' })
      } else {
        await request('/api/fitness/workouts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })
        toast({ title: 'Workout logged', description: 'A new workout has been added.', variant: 'success' })
      }
      setIsDialogOpen(false)
      setFormData({
        date: new Date().toISOString().split('T')[0],
        note: '',
      })
      setCurrentWorkout(null)
      fetchWorkouts({ silent: true })
    } catch (error) {
      toast({
        title: currentWorkout ? 'Unable to update workout' : 'Unable to create workout',
        description: error.message,
        variant: 'error',
      })
    }
  }

  const handleEdit = (workout) => {
    setCurrentWorkout(workout)
    setFormData({
      date: workout.date,
      note: workout.note || '',
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!workoutToDelete) return
    try {
      await request(`/api/fitness/workouts/${workoutToDelete.id}`, { method: 'DELETE' })
      toast({ title: 'Workout deleted', description: 'The workout has been removed.', variant: 'success' })
      setIsDeleteDialogOpen(false)
      setWorkoutToDelete(null)
      fetchWorkouts({ silent: true })
    } catch (error) {
      toast({
        title: 'Unable to delete workout',
        description: error.message,
        variant: 'error',
      })
    }
  }

  const openNewDialog = () => {
    setCurrentWorkout(null)
    setFormData({
      date: new Date().toISOString().split('T')[0],
      note: '',
    })
    setIsDialogOpen(true)
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

      {isLoading ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-hidden="true" />
            <p className="text-sm text-muted-foreground">Loading your workouts…</p>
          </CardContent>
        </Card>
      ) : loadError ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-center">
            <p className="text-sm text-muted-foreground">{loadError}</p>
            <Button variant="outline" onClick={() => fetchWorkouts()}>
              Try again
            </Button>
          </CardContent>
        </Card>
      ) : workouts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <p className="text-muted-foreground">No workouts yet. Log your first workout!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <Card className="hidden md:block">
            <CardContent className="p-0">
              <table className="w-full table-auto">
                <thead className="border-b text-sm font-semibold text-muted-foreground">
                  <tr className="text-left">
                    <th className="p-4">Date</th>
                    <th className="p-4">Notes</th>
                    <th className="p-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {workouts.map((workout) => (
                    <tr key={workout.id} className="border-b last:border-0">
                      <td className="p-4 font-semibold align-top">{workout.date}</td>
                      <td className="p-4 text-muted-foreground whitespace-pre-wrap break-words align-top">{workout.note}</td>
                      <td className="p-4 align-top">
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
            </CardContent>
          </Card>
          <div className="space-y-3 md:hidden">
            {workouts.map((workout) => (
              <Card key={workout.id}>
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">{workout.date}</p>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(workout)}>
                        <Edit className="mr-2 h-4 w-4" /> Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setWorkoutToDelete(workout)
                          setIsDeleteDialogOpen(true)
                        }}
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </Button>
                    </div>
                  </div>
                  {workout.note ? (
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{workout.note}</p>
                  ) : (
                    <p className="text-xs text-muted-foreground">No notes recorded.</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent onClose={() => setIsDialogOpen(false)}>
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
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="note">Notes</Label>
                <Textarea
                  id="note"
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  rows={8}
                  placeholder="Describe your workout..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">{currentWorkout ? 'Update' : 'Create'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent onClose={() => setIsDeleteDialogOpen(false)}>
          <DialogHeader>
            <DialogTitle>Delete Workout</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete this workout? This action cannot be undone.
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

