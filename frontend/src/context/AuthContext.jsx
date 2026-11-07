import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api, getAuthToken, setAuthToken } from '../api/client'

const AuthContext = createContext(null)
const PROFIL_KEY = 'taxigare_responsable'

function profilStocke() {
  try {
    return JSON.parse(localStorage.getItem(PROFIL_KEY) || 'null')
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [utilisateur, setUtilisateur] = useState(profilStocke)
  const [chargement, setChargement] = useState(() => Boolean(getAuthToken()))

  const deconnecter = useCallback(() => {
    setAuthToken(null)
    localStorage.removeItem(PROFIL_KEY)
    setUtilisateur(null)
  }, [])

  useEffect(() => {
    const gererExpiration = () => deconnecter()
    window.addEventListener('taxigare:unauthorized', gererExpiration)
    return () => window.removeEventListener('taxigare:unauthorized', gererExpiration)
  }, [deconnecter])

  useEffect(() => {
    let actif = true
    if (!getAuthToken()) {
      setChargement(false)
      return undefined
    }

    api
      .me()
      .then((profil) => {
        if (!actif) return
        setUtilisateur(profil)
        localStorage.setItem(PROFIL_KEY, JSON.stringify(profil))
      })
      .catch(() => {
        if (actif) deconnecter()
      })
      .finally(() => {
        if (actif) setChargement(false)
      })

    return () => {
      actif = false
    }
  }, [deconnecter])

  const connecter = useCallback(async (email, motDePasse) => {
    const resultat = await api.login(email, motDePasse)
    setAuthToken(resultat.access_token)
    localStorage.setItem(PROFIL_KEY, JSON.stringify(resultat.responsable))
    setUtilisateur(resultat.responsable)
    return resultat.responsable
  }, [])

  const valeur = useMemo(
    () => ({
      utilisateur,
      chargement,
      estConnecte: Boolean(utilisateur && getAuthToken()),
      connecter,
      deconnecter,
    }),
    [utilisateur, chargement, connecter, deconnecter],
  )

  return <AuthContext.Provider value={valeur}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const contexte = useContext(AuthContext)
  if (!contexte) {
    throw new Error('useAuth doit être utilisé dans AuthProvider.')
  }
  return contexte
}
