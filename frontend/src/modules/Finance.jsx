import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Plus, Edit, Trash2, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { request } from '@/lib/api'
import { useToast } from '@/components/ui/toast.jsx'

export default function Finance() {
  const [categories, setCategories] = useState([])
  const [transactions, setTransactions] = useState([])
  const [view, setView] = useState('transactions') // 'transactions' or 'categories'
  
  // Category dialog
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false)
  const [currentCategory, setCurrentCategory] = useState(null)
  const [categoryForm, setCategoryForm] = useState({ name: '', kind: 'expense' })
  
  // Transaction dialog
  const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false)
  const [currentTransaction, setCurrentTransaction] = useState(null)
  const [transactionForm, setTransactionForm] = useState({
    category_id: '',
    amount: '',
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
      const [catData, txData] = await Promise.all([
        request('/api/finance/categories'),
        request('/api/finance/transactions'),
      ])
      setCategories(Array.isArray(catData) ? catData : [])
      setTransactions(Array.isArray(txData) ? txData : [])
    } catch (error) {
      setLoadError(error.message || 'Failed to load finance data')
      toast({
        title: 'Unable to load finance data',
        description: error.message,
        variant: 'error',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const refreshCategories = async () => {
    try {
      const data = await request('/api/finance/categories')
      setCategories(Array.isArray(data) ? data : [])
    } catch (error) {
      toast({
        title: 'Failed to refresh categories',
        description: error.message,
        variant: 'error',
      })
    }
  }

  const refreshTransactions = async () => {
    try {
      const data = await request('/api/finance/transactions')
      setTransactions(Array.isArray(data) ? data : [])
    } catch (error) {
      toast({
        title: 'Failed to refresh transactions',
        description: error.message,
        variant: 'error',
      })
    }
  }

  // Category handlers
  const handleCategorySubmit = async (e) => {
    e.preventDefault()
    try {
      if (currentCategory) {
        await request(`/api/finance/categories/${currentCategory.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(categoryForm),
        })
        toast({ title: 'Category updated', description: 'Changes saved successfully.', variant: 'success' })
      } else {
        await request('/api/finance/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(categoryForm),
        })
        toast({ title: 'Category created', description: 'A new category is ready to use.', variant: 'success' })
      }
      setIsCategoryDialogOpen(false)
      setCategoryForm({ name: '', kind: 'expense' })
      setCurrentCategory(null)
      refreshCategories()
    } catch (error) {
      toast({
        title: currentCategory ? 'Unable to update category' : 'Unable to create category',
        description: error.message,
        variant: 'error',
      })
    }
  }

  const handleEditCategory = (category) => {
    setCurrentCategory(category)
    setCategoryForm({ name: category.name, kind: category.kind })
    setIsCategoryDialogOpen(true)
  }

  const handleDeleteCategory = async () => {
    if (!itemToDelete) return
    try {
      await request(`/api/finance/categories/${itemToDelete.id}`, { method: 'DELETE' })
      toast({ title: 'Category deleted', description: 'The category has been removed.', variant: 'success' })
      setIsDeleteDialogOpen(false)
      setItemToDelete(null)
      refreshCategories()
      refreshTransactions()
    } catch (error) {
      toast({
        title: 'Unable to delete category',
        description: error.message,
        variant: 'error',
      })
    }
  }

  // Transaction handlers
  const handleTransactionSubmit = async (e) => {
    e.preventDefault()
    try {
      if (currentTransaction) {
        await request(`/api/finance/transactions/${currentTransaction.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(transactionForm),
        })
        toast({ title: 'Transaction updated', description: 'Your changes have been saved.', variant: 'success' })
      } else {
        await request('/api/finance/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(transactionForm),
        })
        toast({ title: 'Transaction created', description: 'The transaction has been recorded.', variant: 'success' })
      }
      setIsTransactionDialogOpen(false)
      setTransactionForm({
        category_id: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        note: '',
      })
      setCurrentTransaction(null)
      refreshTransactions()
    } catch (error) {
      toast({
        title: currentTransaction ? 'Unable to update transaction' : 'Unable to create transaction',
        description: error.message,
        variant: 'error',
      })
    }
  }

  const handleEditTransaction = (transaction) => {
    setCurrentTransaction(transaction)
    setTransactionForm({
      category_id: transaction.category_id,
      amount: transaction.amount,
      date: transaction.date,
      note: transaction.note || '',
    })
    setIsTransactionDialogOpen(true)
  }

  const handleDeleteTransaction = async () => {
    if (!itemToDelete) return
    try {
      await request(`/api/finance/transactions/${itemToDelete.id}`, { method: 'DELETE' })
      toast({ title: 'Transaction deleted', description: 'The transaction has been removed.', variant: 'success' })
      setIsDeleteDialogOpen(false)
      setItemToDelete(null)
      refreshTransactions()
    } catch (error) {
      toast({
        title: 'Unable to delete transaction',
        description: error.message,
        variant: 'error',
      })
    }
  }

  const openNewCategory = () => {
    setCurrentCategory(null)
    setCategoryForm({ name: '', kind: 'expense' })
    setIsCategoryDialogOpen(true)
  }

  const openNewTransaction = () => {
    setCurrentTransaction(null)
    setTransactionForm({
      category_id: categories[0]?.id || '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      note: '',
    })
    setIsTransactionDialogOpen(true)
  }

  const formatAmount = (amount, kind) => {
    const sign = kind === 'income' ? '+' : '-'
    return `${sign}$${parseFloat(amount).toFixed(2)}`
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Finance</h1>
          <p className="text-muted-foreground">Track your income and expenses</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={view === 'transactions' ? 'default' : 'outline'}
            onClick={() => setView('transactions')}
          >
            Transactions
          </Button>
          <Button
            variant={view === 'categories' ? 'default' : 'outline'}
            onClick={() => setView('categories')}
          >
            Categories
          </Button>
        </div>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-hidden="true" />
            <p className="text-sm text-muted-foreground">Loading your finance data…</p>
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
      ) : view === 'transactions' ? (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Transactions</h2>
            <Button onClick={openNewTransaction} disabled={categories.length === 0}>
              <Plus className="mr-2 h-4 w-4" />
              New Transaction
            </Button>
          </div>

          {categories.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <p className="text-muted-foreground">Please create a category first</p>
                <Button className="mt-4" onClick={openNewCategory}>
                  Create Category
                </Button>
              </CardContent>
            </Card>
          ) : transactions.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <p className="text-muted-foreground">No transactions yet. Create your first transaction!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <Card className="hidden md:block">
                <CardContent className="p-0">
                  <table className="w-full table-auto">
                    <thead className="border-b">
                      <tr className="text-left text-sm font-semibold text-muted-foreground">
                        <th className="p-4">Date</th>
                        <th className="p-4">Category</th>
                        <th className="p-4">Amount</th>
                        <th className="p-4">Note</th>
                        <th className="p-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((transaction) => (
                        <tr key={transaction.id} className="border-b last:border-0">
                          <td className="p-4 align-top">{transaction.date}</td>
                          <td className="p-4 align-top">{transaction.category_name}</td>
                          <td
                            className={cn(
                              'p-4 font-semibold align-top',
                              transaction.category_kind === 'income' ? 'text-green-600' : 'text-red-600'
                            )}
                          >
                            {formatAmount(transaction.amount, transaction.category_kind)}
                          </td>
                          <td className="p-4 text-muted-foreground whitespace-pre-wrap break-words align-top">{transaction.note}</td>
                          <td className="p-4 align-top">
                            <div className="flex gap-2">
                              <Button size="sm" variant="ghost" onClick={() => handleEditTransaction(transaction)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setItemToDelete(transaction)
                                  setDeleteType('transaction')
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
                {transactions.map((transaction) => (
                  <Card key={transaction.id}>
                    <CardContent className="space-y-3 p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold">{transaction.date}</p>
                          <p className="text-xs text-muted-foreground">{transaction.category_name}</p>
                        </div>
                        <span
                          className={cn(
                            'text-sm font-semibold',
                            transaction.category_kind === 'income' ? 'text-green-600' : 'text-red-600'
                          )}
                        >
                          {formatAmount(transaction.amount, transaction.category_kind)}
                        </span>
                      </div>
                      {transaction.note ? (
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{transaction.note}</p>
                      ) : null}
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="flex-1" onClick={() => handleEditTransaction(transaction)}>
                          <Edit className="mr-2 h-4 w-4" /> Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => {
                            setItemToDelete(transaction)
                            setDeleteType('transaction')
                            setIsDeleteDialogOpen(true)
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </Button>
                      </div>
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
            <h2 className="text-xl font-semibold">Categories</h2>
            <Button onClick={openNewCategory}>
              <Plus className="mr-2 h-4 w-4" />
              New Category
            </Button>
          </div>

          {categories.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <p className="text-muted-foreground">No categories yet. Create your first category!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {categories.map((category) => (
                <Card key={category.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{category.name}</span>
                      <span className={`text-sm px-2 py-1 rounded ${category.kind === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {category.kind}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleEditCategory(category)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setItemToDelete(category)
                          setDeleteType('category')
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
        </div>
      )}

      {/* Category Dialog */}
      <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
        <DialogContent onClose={() => setIsCategoryDialogOpen(false)}>
          <DialogHeader>
            <DialogTitle>{currentCategory ? 'Edit Category' : 'New Category'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCategorySubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="category-name">Name</Label>
                <Input
                  id="category-name"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category-kind">Type</Label>
                <Select
                  id="category-kind"
                  value={categoryForm.kind}
                  onChange={(e) => setCategoryForm({ ...categoryForm, kind: e.target.value })}
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCategoryDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">{currentCategory ? 'Update' : 'Create'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Transaction Dialog */}
      <Dialog open={isTransactionDialogOpen} onOpenChange={setIsTransactionDialogOpen}>
        <DialogContent onClose={() => setIsTransactionDialogOpen(false)}>
          <DialogHeader>
            <DialogTitle>{currentTransaction ? 'Edit Transaction' : 'New Transaction'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleTransactionSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="transaction-category">Category</Label>
                <Select
                  id="transaction-category"
                  value={transactionForm.category_id}
                  onChange={(e) => setTransactionForm({ ...transactionForm, category_id: e.target.value })}
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name} ({cat.kind})
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="transaction-amount">Amount</Label>
                <Input
                  id="transaction-amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={transactionForm.amount}
                  onChange={(e) => setTransactionForm({ ...transactionForm, amount: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="transaction-date">Date</Label>
                <Input
                  id="transaction-date"
                  type="date"
                  value={transactionForm.date}
                  onChange={(e) => setTransactionForm({ ...transactionForm, date: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="transaction-note">Note</Label>
                <Input
                  id="transaction-note"
                  value={transactionForm.note}
                  onChange={(e) => setTransactionForm({ ...transactionForm, note: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsTransactionDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">{currentTransaction ? 'Update' : 'Create'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent onClose={() => setIsDeleteDialogOpen(false)}>
          <DialogHeader>
            <DialogTitle>Delete {deleteType === 'category' ? 'Category' : 'Transaction'}</DialogTitle>
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
              onClick={deleteType === 'category' ? handleDeleteCategory : handleDeleteTransaction}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

