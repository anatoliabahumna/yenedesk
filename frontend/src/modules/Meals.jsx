import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Edit, Trash2, Loader2 } from 'lucide-react'
import { request } from '@/lib/api'
import { useToast } from '@/components/ui/toast.jsx'

export default function Meals() {
  const [recipes, setRecipes] = useState([])
  const [mealPlans, setMealPlans] = useState([])
  const [view, setView] = useState('plans') // 'plans' or 'recipes'
  
  // Recipe dialog
  const [isRecipeDialogOpen, setIsRecipeDialogOpen] = useState(false)
  const [currentRecipe, setCurrentRecipe] = useState(null)
  const [recipeForm, setRecipeForm] = useState({ title: '', ingredients: '', steps: '' })
  
  // Meal plan dialog
  const [isPlanDialogOpen, setIsPlanDialogOpen] = useState(false)
  const [currentPlan, setCurrentPlan] = useState(null)
  const [planForm, setPlanForm] = useState({
    date: new Date().toISOString().split('T')[0],
    note: '',
  })
  
  // Delete dialogs
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState(null)
  const [deleteType, setDeleteType] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const toast = useToast()

  useEffect(() => {
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    setIsLoading(true)
    setLoadError(null)
    try {
      const [recipeData, planData] = await Promise.all([
        request('/api/meal/recipes'),
        request('/api/meal/plans'),
      ])
      setRecipes(Array.isArray(recipeData) ? recipeData : [])
      setMealPlans(Array.isArray(planData) ? planData : [])
    } catch (error) {
      setLoadError(error.message || 'Failed to load meal data')
      toast({
        title: 'Unable to load meal data',
        description: error.message,
        variant: 'error',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const refreshRecipes = async () => {
    try {
      const data = await request('/api/meal/recipes')
      setRecipes(Array.isArray(data) ? data : [])
    } catch (error) {
      toast({
        title: 'Failed to refresh recipes',
        description: error.message,
        variant: 'error',
      })
    }
  }

  const refreshMealPlans = async () => {
    try {
      const data = await request('/api/meal/plans')
      setMealPlans(Array.isArray(data) ? data : [])
    } catch (error) {
      toast({
        title: 'Failed to refresh meal plans',
        description: error.message,
        variant: 'error',
      })
    }
  }

  // Recipe handlers
  const handleRecipeSubmit = async (e) => {
    e.preventDefault()
    try {
      if (currentRecipe) {
        await request(`/api/meal/recipes/${currentRecipe.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(recipeForm),
        })
        toast({ title: 'Recipe updated', description: 'Changes saved successfully.', variant: 'success' })
      } else {
        await request('/api/meal/recipes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(recipeForm),
        })
        toast({ title: 'Recipe created', description: 'A new recipe has been added.', variant: 'success' })
      }
      setIsRecipeDialogOpen(false)
      setRecipeForm({ title: '', ingredients: '', steps: '' })
      setCurrentRecipe(null)
      refreshRecipes()
    } catch (error) {
      toast({
        title: currentRecipe ? 'Unable to update recipe' : 'Unable to create recipe',
        description: error.message,
        variant: 'error',
      })
    }
  }

  const handleEditRecipe = (recipe) => {
    setCurrentRecipe(recipe)
    setRecipeForm({ title: recipe.title, ingredients: recipe.ingredients || '', steps: recipe.steps || '' })
    setIsRecipeDialogOpen(true)
  }

  const handleDeleteRecipe = async () => {
    if (!itemToDelete) return
    try {
      await request(`/api/meal/recipes/${itemToDelete.id}`, { method: 'DELETE' })
      toast({ title: 'Recipe deleted', description: 'The recipe has been removed.', variant: 'success' })
      setIsDeleteDialogOpen(false)
      setItemToDelete(null)
      refreshRecipes()
    } catch (error) {
      toast({
        title: 'Unable to delete recipe',
        description: error.message,
        variant: 'error',
      })
    }
  }

  // Meal plan handlers
  const handlePlanSubmit = async (e) => {
    e.preventDefault()
    try {
      if (currentPlan) {
        await request(`/api/meal/plans/${currentPlan.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(planForm),
        })
        toast({ title: 'Meal plan updated', description: 'Your plan has been updated.', variant: 'success' })
      } else {
        await request('/api/meal/plans', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(planForm),
        })
        toast({ title: 'Meal plan created', description: 'A new meal plan has been added.', variant: 'success' })
      }
      setIsPlanDialogOpen(false)
      setPlanForm({
        date: new Date().toISOString().split('T')[0],
        note: '',
      })
      setCurrentPlan(null)
      refreshMealPlans()
    } catch (error) {
      toast({
        title: currentPlan ? 'Unable to update meal plan' : 'Unable to create meal plan',
        description: error.message,
        variant: 'error',
      })
    }
  }

  const handleEditPlan = (plan) => {
    setCurrentPlan(plan)
    setPlanForm({ date: plan.date, note: plan.note || '' })
    setIsPlanDialogOpen(true)
  }

  const handleDeletePlan = async () => {
    if (!itemToDelete) return
    try {
      await request(`/api/meal/plans/${itemToDelete.id}`, { method: 'DELETE' })
      toast({ title: 'Meal plan deleted', description: 'The meal plan has been removed.', variant: 'success' })
      setIsDeleteDialogOpen(false)
      setItemToDelete(null)
      refreshMealPlans()
    } catch (error) {
      toast({
        title: 'Unable to delete meal plan',
        description: error.message,
        variant: 'error',
      })
    }
  }

  const openNewRecipe = () => {
    setCurrentRecipe(null)
    setRecipeForm({ title: '', ingredients: '', steps: '' })
    setIsRecipeDialogOpen(true)
  }

  const openNewPlan = () => {
    setCurrentPlan(null)
    setPlanForm({
      date: new Date().toISOString().split('T')[0],
      note: '',
    })
    setIsPlanDialogOpen(true)
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
          >
            Meal Plans
          </Button>
          <Button
            variant={view === 'recipes' ? 'default' : 'outline'}
            onClick={() => setView('recipes')}
          >
            Recipes
          </Button>
        </div>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-hidden="true" />
            <p className="text-sm text-muted-foreground">Loading your meal data…</p>
          </CardContent>
        </Card>
      ) : loadError ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-center">
            <p className="text-sm text-muted-foreground">{loadError}</p>
            <Button variant="outline" onClick={loadInitialData}>
              Try again
            </Button>
          </CardContent>
        </Card>
      ) : view === 'plans' ? (
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
              <CardContent className="flex flex-col items-center justify-center py-16">
                <p className="text-muted-foreground">No meal plans yet. Create your first meal plan!</p>
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
                        <th className="p-4">Plan</th>
                        <th className="p-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mealPlans.map((plan) => (
                        <tr key={plan.id} className="border-b last:border-0">
                          <td className="p-4 font-semibold align-top">{plan.date}</td>
                          <td className="p-4 text-muted-foreground whitespace-pre-wrap break-words align-top">{plan.note}</td>
                          <td className="p-4 align-top">
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
                </CardContent>
              </Card>
              <div className="space-y-3 md:hidden">
                {mealPlans.map((plan) => (
                  <Card key={plan.id}>
                    <CardContent className="space-y-3 p-4">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold">{plan.date}</p>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleEditPlan(plan)}>
                            <Edit className="mr-2 h-4 w-4" /> Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setItemToDelete(plan)
                              setDeleteType('plan')
                              setIsDeleteDialogOpen(true)
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </Button>
                        </div>
                      </div>
                      {plan.note ? (
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{plan.note}</p>
                      ) : (
                        <p className="text-xs text-muted-foreground">No details recorded.</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
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
              <CardContent className="flex flex-col items-center justify-center py-16">
                <p className="text-muted-foreground">No recipes yet. Create your first recipe!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {recipes.map((recipe) => (
                <Card key={recipe.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle>{recipe.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-semibold text-sm mb-1">Ingredients:</h4>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap md:line-clamp-3">
                          {recipe.ingredients}
                        </p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm mb-1">Steps:</h4>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap md:line-clamp-3">
                          {recipe.steps}
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
      <Dialog open={isRecipeDialogOpen} onOpenChange={setIsRecipeDialogOpen}>
        <DialogContent onClose={() => setIsRecipeDialogOpen(false)}>
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
                  onChange={(e) => setRecipeForm({ ...recipeForm, title: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="recipe-ingredients">Ingredients</Label>
                <Textarea
                  id="recipe-ingredients"
                  value={recipeForm.ingredients}
                  onChange={(e) => setRecipeForm({ ...recipeForm, ingredients: e.target.value })}
                  rows={4}
                  placeholder="List ingredients..."
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
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsRecipeDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">{currentRecipe ? 'Update' : 'Create'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Meal Plan Dialog */}
      <Dialog open={isPlanDialogOpen} onOpenChange={setIsPlanDialogOpen}>
        <DialogContent onClose={() => setIsPlanDialogOpen(false)}>
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
                  onChange={(e) => setPlanForm({ ...planForm, date: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="plan-note">Plan</Label>
                <Textarea
                  id="plan-note"
                  value={planForm.note}
                  onChange={(e) => setPlanForm({ ...planForm, note: e.target.value })}
                  rows={6}
                  placeholder="What are you planning to eat today?"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsPlanDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">{currentPlan ? 'Update' : 'Create'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent onClose={() => setIsDeleteDialogOpen(false)}>
          <DialogHeader>
            <DialogTitle>Delete {deleteType === 'recipe' ? 'Recipe' : 'Meal Plan'}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete this {deleteType}? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={deleteType === 'recipe' ? handleDeleteRecipe : handleDeletePlan}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

