import { atom } from 'nanostores'

import { ideSeedCwd } from '@/store/windows'

/**
 * The workspace root the IDE is showing. Seeded from the opener's cwd (the
 * window URL carries it) and kept in sync by the chat column as IDE sessions
 * come and go; the explorer rail and the status bar read it. Window-scoped:
 * this atom lives only in the IDE renderer.
 */
export const $ideWorkspaceRoot = atom<null | string>(ideSeedCwd())

export function setIdeWorkspaceRoot(root: null | string | undefined) {
  $ideWorkspaceRoot.set(root?.trim() || null)
}

/** The trailing path segment of a workspace root ("D:\\apps\\COAI" → "COAI"). */
export function workspaceBasename(root: null | string): null | string {
  if (!root) {
    return null
  }

  return root.split(/[\\/]/).filter(Boolean).pop() ?? root
}
