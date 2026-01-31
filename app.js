/* Einkaufsliste App - Einfach & Modern
   Speichert in localStorage, unterstützt mehrere Listen, abhaken verschiebt in 'Gekauft'.
*/
(() => {
  const STORAGE_KEY = 'shopping-app-v1'

  // DOM
  const listsEl = document.getElementById('lists')
  const newListBtn = document.getElementById('new-list-btn')
  const newListNameInput = document.getElementById('new-list-name')
  const createListBtn = document.getElementById('create-list')

  const listTitleInput = document.getElementById('list-title')
  const deleteListBtn = document.getElementById('delete-list')
  const renameListBtn = document.getElementById('rename-list')

  const newItemInput = document.getElementById('new-item')
  const addItemBtn = document.getElementById('add-item-btn')

  const activeItemsEl = document.getElementById('active-items')
  const completedItemsEl = document.getElementById('completed-items')
  const completedSection = document.getElementById('completed-section')

  const clearCompletedBtn = document.getElementById('clear-completed')
  const clearAllBtn = document.getElementById('clear-all')

  const template = document.getElementById('list-item-template')

  // State
  let state = {
    lists: [],
    activeListId: null
  }

  // Utils
  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2,8)
  }

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }
  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) state = JSON.parse(raw)
      if (!state.lists || state.lists.length === 0) {
        // default list
        const id = uid()
        state.lists = [{ id, name: 'Meine Liste', items: [] }]
        state.activeListId = id
        save()
      }
    } catch (e) {
      console.error('Fehler beim Laden', e)
    }
  }

  function getActiveList() {
    return state.lists.find(l => l.id === state.activeListId)
  }

  // Rendering
  function renderLists() {
    listsEl.innerHTML = ''
    state.lists.forEach(list => {
      const div = document.createElement('div')
      div.className = 'list-item' + (list.id === state.activeListId ? ' active' : '')
      div.dataset.id = list.id
      div.innerHTML = `<div class="list-name">${escapeHtml(list.name)}</div> <div class="list-count">${list.items.length}</div>`
      div.addEventListener('click', () => { state.activeListId = list.id; render(); })
      listsEl.appendChild(div)
    })
  }

  function renderActiveList() {
    const active = getActiveList()
    if (!active) return
    listTitleInput.value = active.name

    // Sort: offene zuerst, danach abgeschlossene
    const open = active.items.filter(i => !i.checked)
    const done = active.items.filter(i => i.checked)

    activeItemsEl.innerHTML = ''
    open.forEach(i => activeItemsEl.appendChild(renderItem(i)))

    completedItemsEl.innerHTML = ''
    if (done.length > 0) {
      completedSection.hidden = false
      done.forEach(i => completedItemsEl.appendChild(renderItem(i)))
    } else {
      completedSection.hidden = true
    }
  }

  function renderItem(item) {
    const node = template.content.cloneNode(true)
    const li = node.querySelector('li')
    li.dataset.id = item.id
    const checkbox = li.querySelector('.item-checkbox')
    const text = li.querySelector('.item-text')

    checkbox.checked = !!item.checked
    text.textContent = item.text
    if (item.checked) text.classList.add('done')

    checkbox.addEventListener('change', () => toggleItemChecked(item.id))
    li.querySelector('.delete-item').addEventListener('click', () => deleteItem(item.id))
    li.querySelector('.edit-item').addEventListener('click', () => editItem(item.id))

    return li
  }

  // Actions
  function addList(name) {
    const id = uid()
    state.lists.push({ id, name: name || 'Neue Liste', items: [] })
    state.activeListId = id
    save(); render()
  }

  function deleteList(id) {
    const idx = state.lists.findIndex(l => l.id === id)
    if (idx === -1) return
    state.lists.splice(idx,1)
    if (!state.lists.length) {
      addList('Meine Liste')
    }
    if (state.activeListId === id) state.activeListId = state.lists[0].id
    save(); render()
  }

  function renameActiveList(newName) {
    const l = getActiveList(); if (!l) return
    l.name = newName || l.name
    save(); renderLists()
  }

  function addItem(text) {
    if (!text || !text.trim()) return
    const l = getActiveList(); if (!l) return
    l.items.unshift({ id: uid(), text: text.trim(), checked: false, createdAt: Date.now() })
    save(); renderActiveList()
  }

  function toggleItemChecked(itemId) {
    const l = getActiveList(); if (!l) return
    const it = l.items.find(i => i.id === itemId)
    if (!it) return
    it.checked = !it.checked
    save(); renderActiveList(); renderLists()
  }

  function deleteItem(itemId) {
    const l = getActiveList(); if (!l) return
    l.items = l.items.filter(i => i.id !== itemId)
    save(); renderActiveList(); renderLists()
  }

  function editItem(itemId) {
    const l = getActiveList(); if (!l) return
    const it = l.items.find(i => i.id === itemId)
    if (!it) return
    const newText = prompt('Artikel bearbeiten', it.text)
    if (newText !== null) {
      it.text = newText.trim()
      save(); renderActiveList(); renderLists()
    }
  }

  function clearCompleted() {
    const l = getActiveList(); if (!l) return
    const count = l.items.filter(i => i.checked).length
    if (count === 0) return
    if (!confirm(`Alle ${count} abgehakten Artikel löschen?`)) return
    l.items = l.items.filter(i => !i.checked)
    save(); renderActiveList(); renderLists()
  }

  function clearAll() {
    const l = getActiveList(); if (!l) return
    if (!confirm('Alle Artikel dieser Liste löschen?')) return
    l.items = []
    save(); renderActiveList(); renderLists()
  }

  // Helpers
  function escapeHtml(s) { return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"})[m]) }

  function render() { renderLists(); renderActiveList() }

  // Events
  newListBtn.addEventListener('click', () => {
    const container = document.querySelector('.new-list-input')
    container.style.display = container.style.display === 'flex' ? 'none' : 'flex'
    if (container.style.display === 'flex') newListNameInput.focus()
  })
  createListBtn.addEventListener('click', () => { if (newListNameInput.value.trim()){ addList(newListNameInput.value.trim()); newListNameInput.value=''; document.querySelector('.new-list-input').style.display='none' } })
  newListNameInput.addEventListener('keydown', e => { if (e.key === 'Enter') createListBtn.click() })

  listTitleInput.addEventListener('change', () => renameActiveList(listTitleInput.value.trim()))
  renameListBtn.addEventListener('click', () => { const newName = prompt('Listenname:', getActiveList().name); if (newName!==null) { renameActiveList(newName.trim()) } })
  deleteListBtn.addEventListener('click', () => { if (confirm('Diese Liste löschen?')) deleteList(state.activeListId) })

  addItemBtn.addEventListener('click', () => { addItem(newItemInput.value); newItemInput.value=''; newItemInput.focus() })
  newItemInput.addEventListener('keydown', e => { if (e.key === 'Enter') addItemBtn.click() })

  clearCompletedBtn.addEventListener('click', clearCompleted)
  clearAllBtn.addEventListener('click', clearAll)

  // Init
  load(); render()

  // Expose for debugging in console (optional)
  window.ShoppingApp = { state, save }
})();