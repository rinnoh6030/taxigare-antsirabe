export const TOKEN_KEY = 'taxigare_token'

function normaliserBaseUrl(value) {
  let base = String(value || '').trim().replace(/\/+$/, '')
  if (!base) base = 'http://localhost:8000'
  if (!/^https?:\/\//i.test(base)) base = `https://${base}`
  if (base.endsWith('/api')) base = base.slice(0, -4)
  return base
}

export const API_BASE_URL = normaliserBaseUrl(import.meta.env.VITE_API_URL)

export class ApiError extends Error {
  constructor(message, status, detail) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.detail = detail
  }
}

export function getAuthToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setAuthToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

function messageErreur(payload, status) {
  const detail = payload?.detail
  if (typeof detail === 'string') return detail
  if (detail?.message) return detail.message
  if (Array.isArray(detail) && detail[0]?.msg) return detail[0].msg
  if (status === 401) return 'Session expirée. Veuillez vous reconnecter.'
  if (status >= 500) return 'Une erreur serveur est survenue. Veuillez réessayer.'
  return 'La requête n’a pas pu aboutir.'
}

async function request(path, options = {}) {
  const {
    method = 'GET',
    body,
    token,
    withAuth = true,
    headers: extraHeaders = {},
  } = options

  const headers = { ...extraHeaders }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  const authToken = token ?? (withAuth ? getAuthToken() : null)
  if (authToken) headers.Authorization = `Bearer ${authToken}`

  let response
  try {
    response = await fetch(`${API_BASE_URL}/api${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError(
      'Impossible de joindre le serveur. Vérifiez votre connexion et l’URL de l’API.',
      0,
      null,
    )
  }

  const contentType = response.headers.get('content-type') || ''
  let payload = null
  if (response.status !== 204) {
    payload = contentType.includes('application/json')
      ? await response.json().catch(() => null)
      : await response.text().catch(() => null)
  }

  if (!response.ok) {
    if (response.status === 401 && withAuth) {
      window.dispatchEvent(new Event('taxigare:unauthorized'))
    }
    throw new ApiError(
      messageErreur(payload, response.status),
      response.status,
      payload?.detail ?? payload,
    )
  }

  return payload
}

function queryString(params) {
  const search = new URLSearchParams()
  Object.entries(params).forEach(([cle, valeur]) => {
    if (valeur !== undefined && valeur !== null && valeur !== '') {
      search.set(cle, valeur)
    }
  })
  const resultat = search.toString()
  return resultat ? `?${resultat}` : ''
}

export function ticketQrUrl(code) {
  return `${API_BASE_URL}/api/reservations/${encodeURIComponent(code)}/qr.png`
}

export function ticketPdfUrl(code) {
  return `${API_BASE_URL}/api/reservations/${encodeURIComponent(code)}/ticket.pdf`
}

export const api = {
  login: (email, motDePasse) =>
    request('/auth/login', {
      method: 'POST',
      body: { email, mot_de_passe: motDePasse },
      withAuth: false,
    }),
  me: () => request('/auth/me'),

  getGares: () => request('/gares'),
  getDestinations: (gareId) => request(`/gares/${gareId}/destinations`),
  getVehicle: (vehiculeId) => request(`/vehicules/${vehiculeId}`),
  searchVehicles: ({ gareId, destination, date }) =>
    request(
      `/recherche${queryString({
        gare_id: gareId,
        destination,
        date,
      })}`,
    ),
  getPublicDepartures: ({ gareId, date } = {}) =>
    request(
      `/departs-publics${queryString({
        gare_id: gareId,
        date,
      })}`,
    ),

  createReservation: (payload) =>
    request('/reservations', { method: 'POST', body: payload }),
  getReservation: (code) =>
    request(`/reservations/${encodeURIComponent(code)}`),
  payerReservation: (code, moyen) =>
    request(`/reservations/${encodeURIComponent(code)}/payer`, {
      method: 'POST',
      body: { moyen },
      withAuth: false,
    }),
  annulerReservation: (code) =>
    request(`/reservations/${encodeURIComponent(code)}/annuler`, {
      method: 'POST',
      withAuth: false,
    }),
  scanTicket: (code) =>
    request('/scan', { method: 'POST', body: { code } }),

  getAdminVehicles: ({ date, statut } = {}) =>
    request(
      `/backoffice/vehicules${queryString({
        date,
        statut,
      })}`,
    ),
  getVehicleReservations: (vehiculeId) =>
    request(`/backoffice/vehicules/${vehiculeId}/reservations`),
  createVehicle: (payload) =>
    request('/backoffice/vehicules', { method: 'POST', body: payload }),
  updateVehicle: (vehiculeId, payload) =>
    request(`/backoffice/vehicules/${vehiculeId}`, {
      method: 'PATCH',
      body: payload,
    }),
  deleteVehicle: (vehiculeId) =>
    request(`/backoffice/vehicules/${vehiculeId}`, { method: 'DELETE' }),
  updateOccupation: (vehiculeId, passagersABord) =>
    request(`/backoffice/vehicules/${vehiculeId}/occupation`, {
      method: 'PATCH',
      body: { passagers_a_bord: passagersABord },
    }),
  departVehicle: (vehiculeId, payload) =>
    request(`/backoffice/vehicules/${vehiculeId}/depart`, {
      method: 'POST',
      body: payload,
    }),
  cancelVehicle: (vehiculeId, motif) =>
    request(`/backoffice/vehicules/${vehiculeId}/annuler`, {
      method: 'POST',
      body: { motif },
    }),
  getNotifications: () => request('/backoffice/notifications'),
  getAdminStats: () => request('/backoffice/statistiques'),
}
