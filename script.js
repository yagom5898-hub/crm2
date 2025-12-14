const $ = s => document.querySelector(s)
const $$ = s => Array.from(document.querySelectorAll(s))

const state = { selectedCustomer: null, ready: false }

async function fetchJSON(url, opts) {
  const r = await fetch(url, Object.assign({ headers: { 'Content-Type': 'application/json' } }, opts))
  if (!r.ok) throw new Error(await r.text())
  return r.status === 204 ? null : r.json()
}

async function initApp() {
  try {
    const health = await fetchJSON('/api/health')
    if (!health?.env?.LIBSQL_URL || !health?.env?.LIBSQL_AUTH_TOKEN) {
      $('#customers-list').innerHTML = '<div class="muted">Configure LIBSQL_URL e LIBSQL_AUTH_TOKEN para carregar dados.</div>'
      state.ready = false
      return
    }
    state.ready = true
    await loadCustomers($('#search').value.trim())
  } catch (e) {
    $('#customers-list').innerHTML = '<div class="muted">Falha ao verificar ambiente. Tente novamente.</div>'
  }
}

async function loadCustomers(q = '') {
  const data = await fetchJSON(`/api/customers${q ? `?q=${encodeURIComponent(q)}` : ''}`)
  renderCustomers(data)
}

function renderCustomers(items) {
  const list = $('#customers-list')
  list.innerHTML = ''
  items.forEach(c => {
    const el = document.createElement('div')
    el.className = 'row'
    const info = document.createElement('div')
    info.className = 'info'
    info.innerHTML = `<strong>${c.name}</strong><span class="muted">${c.phone}${c.email ? ' • ' + c.email : ''} • ${c.service_main}</span>`
    const actions = document.createElement('div')
    const btnView = document.createElement('button')
    btnView.className = 'small'
    btnView.textContent = 'Atendimentos'
    btnView.onclick = () => selectCustomer(c)
    const btnEdit = document.createElement('button')
    btnEdit.className = 'small secondary'
    btnEdit.textContent = 'Editar'
    btnEdit.onclick = () => editCustomer(c)
    const btnDel = document.createElement('button')
    btnDel.className = 'small danger'
    btnDel.textContent = 'Excluir'
    btnDel.onclick = () => deleteCustomer(c)
    actions.append(btnView, btnEdit, btnDel)
    el.append(info, actions)
    list.append(el)
  })
}

async function submitCustomer(e) {
  e.preventDefault()
  const form = e.target
  const data = Object.fromEntries(new FormData(form).entries())
  if (!state.ready) { alert('Configure o banco (env).'); return }
  await fetchJSON('/api/customers', { method: 'POST', body: JSON.stringify(data) })
  form.reset()
  await loadCustomers($('#search').value.trim())
}

function editCustomer(c) {
  const form = $('#customer-form')
  form.name.value = c.name
  form.phone.value = c.phone
  form.email.value = c.email || ''
  form.service_main.value = c.service_main
  form.notes.value = c.notes || ''
  form.dataset.editId = String(c.id)
  const btn = form.querySelector('button[type="submit"]')
  btn.textContent = 'Atualizar'
}

async function deleteCustomer(c) {
  if (!confirm('Excluir cliente?')) return
  if (!state.ready) { alert('Configure o banco (env).'); return }
  await fetchJSON(`/api/customers/${c.id}`, { method: 'DELETE' })
  if (state.selectedCustomer && state.selectedCustomer.id === c.id) hideAttendance()
  await loadCustomers($('#search').value.trim())
}

async function handleCustomerSubmit(e) {
  e.preventDefault()
  const form = e.target
  const id = form.dataset.editId
  const data = Object.fromEntries(new FormData(form).entries())
  if (!state.ready) { alert('Configure o banco (env).'); return }
  if (id) {
    await fetchJSON(`/api/customers/${id}`, { method: 'PUT', body: JSON.stringify(data) })
  } else {
    await fetchJSON('/api/customers', { method: 'POST', body: JSON.stringify(data) })
  }
  form.reset()
  delete form.dataset.editId
  form.querySelector('button[type="submit"]').textContent = 'Salvar'
  await loadCustomers($('#search').value.trim())
}

async function selectCustomer(c) {
  state.selectedCustomer = c
  $('#attendance-section').classList.remove('hidden')
  $('#selected-customer').innerHTML = `<strong>${c.name}</strong><div class="muted">${c.phone}${c.email ? ' • ' + c.email : ''}</div>`
  await loadAttendances(c.id)
}

function hideAttendance() {
  state.selectedCustomer = null
  $('#attendance-section').classList.add('hidden')
  $('#selected-customer').innerHTML = ''
  $('#attendances-list').innerHTML = ''
}

async function loadAttendances(customerId) {
  const items = await fetchJSON(`/api/customers/${customerId}/attendances`)
  const list = $('#attendances-list')
  list.innerHTML = ''
  items.forEach(a => {
    const el = document.createElement('div')
    el.className = 'row'
    const info = document.createElement('div')
    info.className = 'info'
    info.innerHTML = `<strong>${a.date} • ${a.service}</strong><span class="muted">R$ ${Number(a.amount).toFixed(2)}${a.notes ? ' • ' + a.notes : ''}</span>`
    const actions = document.createElement('div')
    const btnEdit = document.createElement('button')
    btnEdit.className = 'small secondary'
    btnEdit.textContent = 'Editar'
    btnEdit.onclick = () => editAttendance(a)
    const btnDel = document.createElement('button')
    btnDel.className = 'small danger'
    btnDel.textContent = 'Excluir'
    btnDel.onclick = () => deleteAttendance(a)
    actions.append(btnEdit, btnDel)
    el.append(info, actions)
    list.append(el)
  })
}

function editAttendance(a) {
  const form = $('#attendance-form')
  form.date.value = a.date
  form.service.value = a.service
  form.amount.value = a.amount
  form.notes.value = a.notes || ''
  form.dataset.editId = String(a.id)
  form.querySelector('button[type="submit"]').textContent = 'Atualizar'
}

async function deleteAttendance(a) {
  if (!confirm('Excluir atendimento?')) return
  if (!state.ready) { alert('Configure o banco (env).'); return }
  await fetchJSON(`/api/attendances/${a.id}`, { method: 'DELETE' })
  if (state.selectedCustomer) await loadAttendances(state.selectedCustomer.id)
}

async function submitAttendance(e) {
  e.preventDefault()
  const form = e.target
  const cid = state.selectedCustomer?.id
  if (!cid) return
  const id = form.dataset.editId
  const data = Object.fromEntries(new FormData(form).entries())
  if (!state.ready) { alert('Configure o banco (env).'); return }
  if (id) {
    await fetchJSON(`/api/attendances/${id}`, { method: 'PUT', body: JSON.stringify(data) })
  } else {
    await fetchJSON(`/api/customers/${cid}/attendances`, { method: 'POST', body: JSON.stringify(data) })
  }
  form.reset()
  delete form.dataset.editId
  form.querySelector('button[type="submit"]').textContent = 'Adicionar'
  await loadAttendances(cid)
}

$('#customer-form').addEventListener('submit', handleCustomerSubmit)
$('#attendance-form').addEventListener('submit', submitAttendance)
$('#search').addEventListener('input', e => state.ready && loadCustomers(e.target.value.trim()))
$('#refresh').addEventListener('click', () => state.ready && loadCustomers($('#search').value.trim()))

initApp()
