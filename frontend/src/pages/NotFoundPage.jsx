import { ArrowLeft, MapPinOff } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="container-page flex min-h-[55vh] flex-col items-center justify-center py-20 text-center">
      <span className="flex h-20 w-20 items-center justify-center rounded-3xl bg-primary-50 text-primary-400">
        <MapPinOff className="h-9 w-9" />
      </span>
      <p className="mt-6 font-display text-6xl font-extrabold tracking-tight text-primary-900">
        404
      </p>
      <h1 className="mt-3 font-display text-2xl font-bold text-primary-900">
        Cette route n’existe pas.
      </h1>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-500">
        La page demandée a peut-être été déplacée. Retrouvez votre chemin depuis
        l’accueil ou le tableau des départs.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link to="/" className="btn-primary">
          <ArrowLeft className="h-4 w-4" />
          Retour à l’accueil
        </Link>
        <Link to="/departs" className="btn-secondary">
          Voir les départs
        </Link>
      </div>
    </div>
  )
}
