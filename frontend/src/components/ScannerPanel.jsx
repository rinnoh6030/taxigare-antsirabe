import { useCallback, useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import {
  AlertTriangle,
  Camera,
  CameraOff,
  CheckCircle2,
  Keyboard,
  QrCode,
  ScanLine,
  ShieldCheck,
  Ticket,
  User,
} from 'lucide-react'
import { api } from '../api/client'
import { Spinner } from './Loading'
import { formatDateLongue, getErrorMessage, nomGare } from '../utils/format'

const READER_ID = 'taxigare-qr-reader'

export default function ScannerPanel({ autoCode = '' }) {
  const [scanActif, setScanActif] = useState(false)
  const [codeManuel, setCodeManuel] = useState('')
  const [erreur, setErreur] = useState('')
  const [erreurCamera, setErreurCamera] = useState('')
  const [resultat, setResultat] = useState(null)
  const [verification, setVerification] = useState(false)
  const scannerRef = useRef(null)
  const traitementRef = useRef(false)
  const autoTraiteRef = useRef(false)

  const validerCode = useCallback(async (codeBrut) => {
    const code = String(codeBrut || '').trim()
    if (!code) {
      setErreur('Saisissez ou scannez un code de billet.')
      return
    }

    setScanActif(false)
    setVerification(true)
    setErreur('')
    setResultat(null)
    try {
      const reponse = await api.scanTicket(code)
      setResultat(reponse)
    } catch (error) {
      setErreur(getErrorMessage(error))
    } finally {
      setVerification(false)
    }
  }, [])

  useEffect(() => {
    if (!autoCode || autoTraiteRef.current) return
    autoTraiteRef.current = true
    traitementRef.current = true
    validerCode(autoCode).finally(() => {
      traitementRef.current = false
    })
  }, [autoCode, validerCode])

  useEffect(() => {
    if (!scanActif) return undefined
    let actif = true
    const scanner = new Html5Qrcode(READER_ID, { verbose: false })
    scannerRef.current = scanner
    setErreurCamera('')

    scanner
      .start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 240, height: 240 },
          aspectRatio: 1,
        },
        (texteDecode) => {
          if (traitementRef.current) return
          traitementRef.current = true
          setScanActif(false)
          validerCode(texteDecode).finally(() => {
            traitementRef.current = false
          })
        },
        () => {},
      )
      .catch((error) => {
        if (!actif) return
        setScanActif(false)
        setErreurCamera(
          error?.message?.includes('Permission')
            ? 'L’accès à la caméra a été refusé. Autorisez la caméra puis réessayez.'
            : 'Impossible de démarrer la caméra. Utilisez la saisie manuelle du code.',
        )
      })

    return () => {
      actif = false
      const instance = scannerRef.current
      scannerRef.current = null
      if (!instance) return
      instance
        .stop()
        .then(() => instance.clear())
        .catch(() => {
          try {
            instance.clear()
          } catch {
            // La librairie nettoie elle-même le lecteur après une erreur.
          }
        })
    }
  }, [scanActif, validerCode])

  function demarrerCamera() {
    traitementRef.current = false
    setErreur('')
    setErreurCamera('')
    setResultat(null)
    setScanActif(true)
  }

  function arreterCamera() {
    setScanActif(false)
  }

  function soumettreManuel(event) {
    event.preventDefault()
    traitementRef.current = true
    validerCode(codeManuel).finally(() => {
      traitementRef.current = false
    })
  }

  function reinitialiser() {
    traitementRef.current = false
    setResultat(null)
    setErreur('')
    setErreurCamera('')
    setCodeManuel('')
    setScanActif(false)
  }

  const reservation = resultat?.reservation

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
      <div className="relative overflow-hidden bg-primary-900 px-5 py-5 text-white sm:px-6">
        <div className="absolute inset-0 bg-dot-grid opacity-[0.09]" />
        <div className="relative flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
              <ScanLine className="h-5 w-5 text-sun-500" />
            </span>
            <div>
              <h2 className="font-display text-lg font-bold">Contrôle du billet</h2>
              <p className="text-[11px] font-semibold text-primary-300">
                Scannez le QR code ou saisissez le code de réservation.
              </p>
            </div>
          </div>
          <span className="hidden items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-[9px] font-extrabold uppercase tracking-wider text-primary-100 sm:inline-flex">
            <ShieldCheck className="h-3 w-3 text-emerald-400" />
            Sécurisé
          </span>
        </div>
      </div>

      <div className="p-5 sm:p-6">
        {resultat ? (
          <div className="animate-fade-up">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-center">
              <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-200">
                <CheckCircle2 className="h-8 w-8" />
              </span>
              <h3 className="mt-4 font-display text-2xl font-extrabold text-emerald-900">
                {resultat.message || 'Embarquement validé'}
              </h3>
              <p className="mt-1 text-xs font-semibold text-emerald-700">
                Le passager peut embarquer. Ce billet est désormais marqué comme
                utilisé.
              </p>
            </div>

            {reservation && (
              <div className="mt-5 rounded-2xl border border-slate-200 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-700">
                      <Ticket className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-400">
                        Billet
                      </p>
                      <p className="font-mono text-xs font-bold text-primary-900">
                        {reservation.code_qr}
                      </p>
                    </div>
                  </div>
                  <span className="badge bg-emerald-50 text-emerald-700">
                    Embarqué
                  </span>
                </div>

                <dl className="mt-5 grid gap-4 border-t border-slate-100 pt-4 sm:grid-cols-2">
                  <div>
                    <dt className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                      <User className="h-3 w-3" />
                      Passager
                    </dt>
                    <dd className="mt-1 text-sm font-bold text-primary-900">
                      {reservation.nom_passager}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                      Places
                    </dt>
                    <dd className="mt-1 text-sm font-bold text-primary-900">
                      {reservation.nombre_places}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                      Destination
                    </dt>
                    <dd className="mt-1 text-sm font-semibold text-slate-600">
                      {reservation.vehicule?.destination}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                      Gare de départ
                    </dt>
                    <dd className="mt-1 text-sm font-semibold text-slate-600">
                      {nomGare(reservation.vehicule?.gare?.nom)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                      Date
                    </dt>
                    <dd className="mt-1 text-sm font-semibold text-slate-600">
                      {formatDateLongue(reservation.vehicule?.date_depart)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                      Départ prévu
                    </dt>
                    <dd className="mt-1 text-sm font-semibold text-slate-600">
                      {reservation.vehicule?.creneau}
                    </dd>
                  </div>
                </dl>
              </div>
            )}

            <button type="button" onClick={reinitialiser} className="btn-primary mt-5 w-full">
              <QrCode className="h-4 w-4" />
              Scanner un autre billet
            </button>
          </div>
        ) : (
          <>
            <div className="relative min-h-[270px] overflow-hidden rounded-2xl bg-primary-900">
              <div
                id={READER_ID}
                className={scanActif ? 'w-full overflow-hidden' : 'hidden'}
              />

              {!scanActif && (
                <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
                  <span className="relative flex h-24 w-24 items-center justify-center rounded-3xl border-2 border-dashed border-white/20 bg-white/5 text-white">
                    <QrCode className="h-10 w-10 text-primary-300" />
                    <span className="absolute left-3 top-3 h-4 w-4 rounded-tl border-l-2 border-t-2 border-sun-500" />
                    <span className="absolute bottom-3 right-3 h-4 w-4 rounded-br border-b-2 border-r-2 border-sun-500" />
                  </span>
                  <p className="mt-5 text-sm font-bold text-white">
                    Caméra désactivée
                  </p>
                  <p className="mt-1 max-w-xs text-[11px] leading-relaxed text-primary-300">
                    Autorisez l’accès à la caméra pour scanner le QR code du
                    passager, ou utilisez le code ci-dessous.
                  </p>
                  <button
                    type="button"
                    onClick={demarrerCamera}
                    className="btn-sun mt-5 px-5 py-2.5"
                  >
                    <Camera className="h-4 w-4" />
                    Activer la caméra
                  </button>
                  {!window.isSecureContext && (
                    <p className="mt-3 text-[10px] text-sun-400">
                      La caméra nécessite HTTPS (ou localhost).
                    </p>
                  )}
                </div>
              )}
            </div>

            {scanActif && (
              <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-4 py-3">
                <p className="flex items-center gap-2 text-[11px] font-semibold text-slate-500">
                  <span className="h-2 w-2 animate-soft-pulse rounded-full bg-emerald-500" />
                  Placez le QR code dans le cadre
                </p>
                <button
                  type="button"
                  onClick={arreterCamera}
                  className="inline-flex items-center gap-1.5 text-[11px] font-bold text-accent-600"
                >
                  <CameraOff className="h-3.5 w-3.5" />
                  Arrêter
                </button>
              </div>
            )}

            {erreurCamera && (
              <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-800">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                {erreurCamera}
              </div>
            )}

            <div className="my-5 flex items-center gap-3">
              <span className="h-px flex-1 bg-slate-200" />
              <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                <Keyboard className="h-3.5 w-3.5" />
                Saisie manuelle
              </span>
              <span className="h-px flex-1 bg-slate-200" />
            </div>

            <form onSubmit={soumettreManuel} className="flex flex-col gap-2 sm:flex-row">
              <input
                type="text"
                className="input font-mono uppercase tracking-wide"
                placeholder="TB-XXXXXXXXXXXXXXXX"
                value={codeManuel}
                onChange={(event) => setCodeManuel(event.target.value)}
                autoComplete="off"
                aria-label="Code du billet"
              />
              <button
                type="submit"
                className="btn-primary shrink-0"
                disabled={verification || !codeManuel.trim()}
              >
                {verification ? (
                  <>
                    <Spinner className="h-4 w-4" />
                    Vérification…
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-4 w-4" />
                    Vérifier
                  </>
                )}
              </button>
            </form>

            {erreur && (
              <div
                role="alert"
                className="mt-4 flex items-start gap-2 rounded-xl border border-accent-100 bg-accent-50 px-4 py-3 text-xs font-semibold text-accent-700"
              >
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                {erreur}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
