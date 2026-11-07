export function cn(...classes) {
  return classes.filter(Boolean).join(' ')
}

export function formatPrice(valeur) {
  return `${new Intl.NumberFormat('fr-FR').format(Number(valeur) || 0)} Ar`
}

export function formatDuration(minutes) {
  const total = Number(minutes) || 0
  if (total < 60) return `${total} min`
  const heures = Math.floor(total / 60)
  const reste = total % 60
  if (!reste) return `${heures} h`
  return `${heures} h ${String(reste).padStart(2, '0')}`
}

function dateLocale(valeur) {
  if (!valeur) return null
  const [annee, mois, jour] = String(valeur).split('-').map(Number)
  if (!annee || !mois || !jour) return null
  return new Date(annee, mois - 1, jour)
}

export function formatDateLongue(valeur) {
  const date = dateLocale(valeur)
  if (!date) return ''
  const resultat = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
  return resultat.charAt(0).toUpperCase() + resultat.slice(1)
}

export function formatDateCourte(valeur) {
  const date = dateLocale(valeur)
  if (!date) return ''
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

export function formatDateHeure(valeur) {
  if (!valeur) return '—'
  const date = new Date(valeur)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export function formatDateJour(valeur) {
  const date = dateLocale(valeur)
  if (!date) return ''
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(date)
}

export function dateDuJour() {
  const maintenant = new Date()
  const annee = maintenant.getFullYear()
  const mois = String(maintenant.getMonth() + 1).padStart(2, '0')
  const jour = String(maintenant.getDate()).padStart(2, '0')
  return `${annee}-${mois}-${jour}`
}

export function nomGare(nom) {
  if (!nom) return 'Gare'
  return nom.toLowerCase().startsWith('a') ? `Gare d’${nom}` : `Gare de ${nom}`
}

export function libelleStatut(statut) {
  return (
    {
      en_attente: 'En attente',
      parti: 'Parti',
      annule: 'Annulé',
      reserve: 'Réservé',
      embarque: 'Embarqué',
    }[statut] || statut
  )
}

export function getErrorMessage(erreur) {
  if (!erreur) return 'Une erreur inattendue est survenue.'
  if (typeof erreur === 'string') return erreur
  if (erreur.message) return erreur.message
  return 'Une erreur inattendue est survenue.'
}

export function pluraliser(mot, nombre) {
  return `${mot}${Number(nombre) > 1 ? 's' : ''}`
}

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}
