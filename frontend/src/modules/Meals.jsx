import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/toast'
import { Plus, Edit, Trash2, Loader2, UtensilsCrossed } from 'lucide-react'

export default function Meals() {
  const [recipes, setRecipes] = useState([])
  const [mealPlans, setMealPlans] = useState([])
  const [view, setView] = useState('plans')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false)
  const [highlightedId, setHighlightedId] = useState(null)
  const { toast } = useToast()

  // Recipe dialog
  const [isRecipeDialogOpen, setIsRecipeDialogOpen] = useState(false)
  const [currentRecipe, setCurrentRecipe] = useState(null)
  const [recipeForm, setRecipeForm] = useState({ title: '', ingredients: '', steps: '' })
  const originalRecipeForm = useRef({ title: '', ingredients: '', steps: '' })

  // Meal plan dialog
  const [isPlanDialogOpen, setIsPlanDialogOpen] = useState(false)
  const [currentPlan, setCurrentPlan] = useState(null)
  const [planForm, setPlanForm] = useState({
    date: new Date().toISOString().split('T')[0],
    note: '',
  })
  const originalPlanForm = useRef({
    date: new Date().toISOString().split('T')[0],
    note: '',
  })

  // Delete dialogs
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState(null)
  const [deleteType, setDeleteType] = useState(null)
  const [formErrors, setFormErrors] = useState({})

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    // Detect unsaved changes
    const recipeChanges =
      recipeForm.title !== originalRecipeForm.current.title ||
      recipeForm.ingredients !== originalRecipeForm.current.ingredients ||
      recipeForm.steps !== originalRecipeForm.current.steps

    const planChanges =
      planForm.date !== originalPlanForm.current.date ||
      planForm.note !== originalPlanForm.current.note

    setHasUnsavedChanges(recipeChanges || planChanges)
  }, [recipeForm, planForm])

  const fetchData = async () => {
    try {
      setIsLoading(true)
      const [recipesRes, plansRes] = await Promise.all([
        fetch('/api/meal/recipes'),
        fetch('/api/meal/plans')
      ])

      if (!recipesRes.ok || !plansRes.ok) {
        throw new Error('Failed to fetch data')
      }

      const [recipesData, plansData] = await Promise.all([
        recipesRes.json(),
        plansRes.json()
      ])

      setRecipes(recipesData)
      setMealPlans(plansData)
    } catch (error) {
      toast.error('Failed to load data', error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const validateRecipeForm = () => {
    const errors = {}
    if (!recipeForm.title.trim()) {
      errors.title = 'Recipe title is required'
    } else if (recipeForm.title.length > 100) {
      errors.title = 'Title must be less than 100 characters'
    }
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const validatePlanForm = () => {
    const errors = {}
    if (!planForm.date) {
      errors.date = 'Date is required'
    }
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Recipe handlers
  const handleRecipeSubmit = async (e) => {
    e.preventDefault()
    if (!validateRecipeForm()) return

    setIsSubmitting(true)
    try {
      const response = currentRecipe
        ? await fetch(`/api/meal/recipes/${currentRecipe.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(recipeForm),
          })
        : await fetch('/api/meal/recipes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(recipeForm),
          })

      if (!response.ok) {
        throw new Error(currentRecipe ? 'Failed to update recipe' : 'Failed to create recipe')
      }

      const savedRecipe = await response.json()

      setIsRecipeDialogOpen(false)
      setRecipeForm({ title: '', ingredients: '', steps: '' })
      setCurrentRecipe(null)
      setHasUnsavedChanges(false)
      setFormErrors({})

      toast.success(
        currentRecipe ? 'Recipe updated!' : 'Recipe created!',
        currentRecipe ? 'Your recipe has been updated.' : 'Your recipe has been created.'
      )

      await fetchData()

      if (!currentRecipe && savedRecipe.id) {
        setHighlightedId(savedRecipe.id)
        setTimeout(() => setHighlightedId(null), 2000)
      }
    } catch (error) {
      toast.error('Failed to save recipe', error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditRecipe = (recipe) => {
    setCurrentRecipe(recipe)
    const formData = {
      title: recipe.title,
      ingredients: recipe.ingredients || '',
      steps: recipe.steps || ''
    }
    setRecipeForm(formData)
    originalRecipeForm.current = { ...formData }
    setIsRecipeDialogOpen(true)
  }

  const handleDeleteRecipe = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/meal/recipes/${itemToDelete.id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Failed to delete recipe')

      setIsDeleteDialogOpen(false)
      setItemToDelete(null)
      toast.success('Recipe deleted', 'Your recipe has been deleted.')
      await fetchData()
    } catch (error) {
      toast.error('Failed to delete recipe', error.message)
    } finally {
      setIsDeleting(false)
    }
  }

  // Meal plan handlers
  const handlePlanSubmit = async (e) => {
    e.preventDefault()
    if (!validatePlanForm()) return

    setIsSubmitting(true)
    try {
      const response = currentPlan
        ? await fetch(`/api/meal/plans/${currentPlan.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(planForm),
          })
        : await fetch('/api/meal/plans', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(planForm),
          })

      if (!response.ok) {
        throw new Error(currentPlan ? 'Failed to update meal plan' : 'Failed to create meal plan')
      }

      const savedPlan = await response.json()

      setIsPlanDialogOpen(false)
      setPlanForm({
        date: new Date().toISOString().split('T')[0],
        note: '',
      })
      setCurrentPlan(null)
      setHasUnsavedChanges(false)
      setFormErrors({})

      toast.success(
        currentPlan ? 'Meal plan updated!' : 'Meal plan created!',
        currentPlan ? 'Your meal plan has been updated.' : 'Your meal plan has been created.'
      )

      await fetchData()

      if (!currentPlan && savedPlan.id) {
        setHighlightedId(savedPlan.id)
        setTimeout(() => setHighlightedId(null), 2000)
      }
    } catch (error) {
      toast.error('Failed to save meal plan', error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditPlan = (plan) => {
    setCurrentPlan(plan)
    const formData = { date: plan.date, note: plan.note || '' }
    setPlanForm(formData)
    originalPlanForm.current = { ...formData }
    setIsPlanDialogOpen(true)
  }

  const handleDeletePlan = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/meal/plans/${itemToDelete.id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Failed to delete meal plan')

      setIsDeleteDialogOpen(false)
      setItemToDelete(null)
      toast.success('Meal plan deleted', 'Your meal plan has been deleted.')
      await fetchData()
    } catch (error) {
      toast.error('Failed to delete meal plan', error.message)
    } finally {
      setIsDeleting(false)
    }
  }

  const openNewRecipe = () => {
    setCurrentRecipe(null)
    setRecipeForm({ title: '', ingredients: '', steps: '' })
    originalRecipeForm.current = { title: '', ingredients: '', steps: '' }
    setFormErrors({})
    setHasUnsavedChanges(false)
    setIsRecipeDialogOpen(true)
  }

  const openNewPlan = () => {
    setCurrentPlan(null)
    const formData = {
      date: new Date().toISOString().split('T')[0],
      note: '',
    }
    setPlanForm(formData)
    originalPlanForm.current = { ...formData }
    setFormErrors({})
    setHasUnsavedChanges(false)
    setIsPlanDialogOpen(true)
  }

  const handleRecipeDialogClose = (open) => {
    if (!open && hasUnsavedChanges) {
      setShowUnsavedWarning(true)
      return
    }
    setIsRecipeDialogOpen(open)
    if (!open) {
      setRecipeForm({ title: '', ingredients: '', steps: '' })
      setCurrentRecipe(null)
      setFormErrors({})
      setHasUnsavedChanges(false)
    }
  }

  const handlePlanDialogClose = (open) => {
    if (!open && hasUnsavedChanges) {
      setShowUnsavedWarning(true)
      return
    }
    setIsPlanDialogOpen(open)
    if (!open) {
      setPlanForm({
        date: new Date().toISOString().split('T')[0],
        note: '',
      })
      setCurrentPlan(null)
      setFormErrors({})
      setHasUnsavedChanges(false)
    }
  }

  const confirmCloseDialog = () => {
    setShowUnsavedWarning(false)
    setIsRecipeDialogOpen(false)
    setIsPlanDialogOpen(false)
    setRecipeForm({ title: '', ingredients: '', steps: '' })
    setPlanForm({
      date: new Date().toISOString().split('T')[0],
      note: '',
    })
    setCurrentRecipe(null)
    setCurrentPlan(null)
    setFormErrors({})
    setHasUnsavedChanges(false)
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
          <h1 className="text-3xl font-bold">Meals</h1>
          <p className="text-muted-foreground">Manage recipes and meal plans</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={view === 'plans' ? 'default' : 'outline'}
            onClick={() => setView('plans')}
            className={view === 'plans' ? 'font-bold' : ''}
          >
            Meal Plans
          </Button>
          <Button
            variant={view === 'recipes' ? 'default' : 'outline'}
            onClick={() => setView('recipes')}
            className={view === 'recipes' ? 'font-bold' : ''}
          >
            Recipes
          </Button>
        </div>
      </div>

      {view === 'plans' ? (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Meal Plans</h2>
            <Button onClick={openNewPlan}>
              <Plus className="mr-2 h-4 w-4" />
              New Plan
            </Button>
          </div>

          {mealPlans.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 space-y-4">
                <UtensilsCrossed className="h-16 w-16 text-muted-foreground opacity-50" />
                <div className="text-center space-y-2">
                  <p className="text-lg font-medium">No meal plans yet</p>
                  <p className="text-sm text-muted-foreground">Create your first meal plan to organize your meals</p>
                </div>
                <Button onClick={openNewPlan} size="lg">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Meal Plan
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="w-full overflow-x-auto relative">
                  <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-card to-transparent pointer-events-none md:hidden" />
                  <table className="w-full min-w-[560px] table-fixed">
                    <thead className="border-b bg-muted/50">
                      <tr className="text-left">
                        <th className="p-4 font-semibold">Date</th>
                        <th className="p-4 font-semibold">Plan</th>
                        <th className="p-4 font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mealPlans.map((plan) => (
                        <tr
                          key={plan.id}
                          className={`border-b last:border-0 hover:bg-muted/50 transition-colors ${
                            highlightedId === plan.id
                              ? 'bg-primary/10 animate-in fade-in duration-500'
                              : ''
                          }`}
                        >
                          <td className="p-4 font-semibold">{plan.date}</td>
                          <td className="p-4 text-muted-foreground whitespace-pre-wrap break-words">{plan.note || '—'}</td>
                          <td className="p-4">
                            <div className="flex gap-2">
                              <Button size="sm" variant="ghost" onClick={() => handleEditPlan(plan)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setItemToDelete(plan)
                                  setDeleteType('plan')
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
        </div>
      ) : (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Recipes</h2>
            <Button onClick={openNewRecipe}>
              <Plus className="mr-2 h-4 w-4" />
              New Recipe
            </Button>
          </div>

          {recipes.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 space-y-4">
                <UtensilsCrossed className="h-16 w-16 text-muted-foreground opacity-50" />
                <div className="text-center space-y-2">
                  <p className="text-lg font-medium">No recipes yet</p>
                  <p className="text-sm text-muted-foreground">Create your first recipe to build your cookbook</p>
                </div>
                <Button onClick={openNewRecipe} size="lg">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Recipe
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {recipes.map((recipe) => (
                <Card
                  key={recipe.id}
                  className={`hover:shadow-lg transition-all ${
                    highlightedId === recipe.id
                      ? 'ring-2 ring-primary animate-in fade-in duration-500'
                      : ''
                  }`}
                >
                  <CardHeader>
                    <CardTitle>{recipe.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-semibold text-sm mb-1">Ingredients:</h4>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-3">
                          {recipe.ingredients || '—'}
                        </p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm mb-1">Steps:</h4>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-3">
                          {recipe.steps || '—'}
                        </p>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button size="sm" variant="outline" onClick={() => handleEditRecipe(recipe)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setItemToDelete(recipe)
                            setDeleteType('recipe')
                            setIsDeleteDialogOpen(true)
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Recipe Dialog */}
      <Dialog open={isRecipeDialogOpen} onOpenChange={handleRecipeDialogClose}>
        <DialogContent onKeyDown={(e) => e.key === 'Escape' && handleRecipeDialogClose(false)}>
          <DialogHeader>
            <DialogTitle>{currentRecipe ? 'Edit Recipe' : 'New Recipe'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleRecipeSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="recipe-title">Title</Label>
                <Input
                  id="recipe-title"
                  value={recipeForm.title}
                  onChange={(e) => {
                    setRecipeForm({ ...recipeForm, title: e.target.value })
                    if (formErrors.title) setFormErrors({ ...formErrors, title: '' })
                  }}
                  className={formErrors.title ? 'border-red-500' : ''}
                  disabled={isSubmitting}
                  autoFocus
                />
                {formErrors.title && (
                  <p className="text-sm text-red-500">{formErrors.title}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="recipe-ingredients">Ingredients</Label>
                <Textarea
                  id="recipe-ingredients"
                  value={recipeForm.ingredients}
                  onChange={(e) => setRecipeForm({ ...recipeForm, ingredients: e.target.value })}
                  rows={4}
                  placeholder="List ingredients..."
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="recipe-steps">Steps</Label>
                <Textarea
                  id="recipe-steps"
                  value={recipeForm.steps}
                  onChange={(e) => setRecipeForm({ ...recipeForm, steps: e.target.value })}
                  rows={4}
                  placeholder="Describe the cooking steps..."
                  disabled={isSubmitting}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleRecipeDialogClose(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {currentRecipe ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  currentRecipe ? 'Update' : 'Create'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Meal Plan Dialog */}
      <Dialog open={isPlanDialogOpen} onOpenChange={handlePlanDialogClose}>
        <DialogContent onKeyDown={(e) => e.key === 'Escape' && handlePlanDialogClose(false)}>
          <DialogHeader>
            <DialogTitle>{currentPlan ? 'Edit Meal Plan' : 'New Meal Plan'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handlePlanSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="plan-date">Date</Label>
                <Input
                  id="plan-date"
                  type="date"
                  value={planForm.date}
                  onChange={(e) => {
                    setPlanForm({ ...planForm, date: e.target.value })
                    if (formErrors.date) setFormErrors({ ...formErrors, date: '' })
                  }}
                  className={formErrors.date ? 'border-red-500' : ''}
                  disabled={isSubmitting}
                  autoFocus
                />
                {formErrors.date && (
                  <p className="text-sm text-red-500">{formErrors.date}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="plan-note">Plan</Label>
                <Textarea
                  id="plan-note"
                  value={planForm.note}
                  onChange={(e) => setPlanForm({ ...planForm, note: e.target.value })}
                  rows={6}
                  placeholder="What are you planning to eat today?"
                  disabled={isSubmitting}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handlePlanDialogClose(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {currentPlan ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  currentPlan ? 'Update' : 'Create'
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

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {deleteType === 'recipe' ? 'Recipe' : 'Meal Plan'}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete{' '}
            <span className="font-semibold">
              "{deleteType === 'recipe' ? itemToDelete?.title : `meal plan for ${itemToDelete?.date}`}"
            </span>
            ? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={deleteType === 'recipe' ? handleDeleteRecipe : handleDeletePlan}
              disabled={isDeleting}
            >
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
