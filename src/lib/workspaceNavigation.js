import { useEffect, useState } from 'react'

const VIEW_PATHS = { catalog: '#/catalogo', team: '#/team', damage: '#/damage-calculator' }

export function readWorkspaceLocation(hash, state) {
  const view = Object.keys(VIEW_PATHS).find((key) => VIEW_PATHS[key] === hash) ?? 'catalog'
  return { view, fromTeam: view === 'damage' && state?.pokemonStats?.fromTeam === true }
}

export function useWorkspaceNavigation() {
  const readLocation = () => readWorkspaceLocation(window.location.hash, window.history.state)
  const [location, setLocation] = useState(readLocation)

  useEffect(() => {
    const update = () => setLocation(readLocation())
    window.addEventListener('popstate', update)
    window.addEventListener('hashchange', update)
    return () => {
      window.removeEventListener('popstate', update)
      window.removeEventListener('hashchange', update)
    }
  }, [])

  function navigate(view, { fromTeam = false } = {}) {
    if (!VIEW_PATHS[view]) return
    const state = { ...window.history.state, pokemonStats: { fromTeam: view === 'damage' && fromTeam } }
    const method = window.location.hash === VIEW_PATHS[view] ? 'replaceState' : 'pushState'
    window.history[method](state, '', VIEW_PATHS[view])
    setLocation(readWorkspaceLocation(VIEW_PATHS[view], state))
    window.scrollTo({ top: 0, behavior: 'instant' })
  }

  return { ...location, navigate }
}
