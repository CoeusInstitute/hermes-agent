import { useStore } from '@nanostores/react'

import { ProjectTree } from '@/app/right-sidebar/files/tree'
import { useProjectTree } from '@/app/right-sidebar/files/use-project-tree'
import { Button } from '@/components/ui/button'
import { Codicon } from '@/components/ui/codicon'
import { EmptyState } from '@/components/ui/empty-state'
import { Loader } from '@/components/ui/loader'
import { Tip } from '@/components/ui/tooltip'
import { useI18n } from '@/i18n'

import { $ideWorkspaceRoot, workspaceBasename } from '../../state'
import { openIdeFile } from '../editor/tabs'

/**
 * Explorer rail: the workspace tree, backed by the app's shared project-tree
 * machinery (lazy dir reads, gitignore filtering, live revalidation) bound to
 * the IDE's own workspace root. Clicking a file opens it in the editor column.
 */
export function ExplorerRegion() {
  const { t } = useI18n()
  const workspaceRoot = useStore($ideWorkspaceRoot)
  const tree = useProjectTree(workspaceRoot ?? '')
  const name = workspaceBasename(tree.effectiveCwd || workspaceRoot)

  return (
    <section
      aria-label={t.ide.explorerTitle}
      className="flex h-full min-h-0 w-full min-w-0 flex-col bg-(--ui-sidebar-surface-background)"
    >
      <header className="flex h-8 shrink-0 items-center gap-1 pr-1 pl-3">
        <span className="min-w-0 flex-1 truncate text-[11px] font-medium tracking-wider text-(--ui-text-tertiary) uppercase">
          {workspaceRoot && name ? name : t.ide.explorerTitle}
        </span>
        {workspaceRoot ? (
          <Tip label={t.ide.refreshExplorer}>
            <Button
              aria-label={t.ide.refreshExplorer}
              onClick={() => void tree.refreshRoot()}
              size="icon-xs"
              type="button"
              variant="ghost"
            >
              <Codicon name="refresh" size={13} />
            </Button>
          </Tip>
        ) : null}
      </header>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {!workspaceRoot ? (
          <EmptyState className="min-h-0 pt-10" description={t.ide.explorerEmptyBody} title={t.ide.explorerEmptyTitle} />
        ) : tree.rootError ? (
          <div className="px-3 pt-4 text-xs leading-relaxed text-muted-foreground">
            {t.ide.explorerUnreadable(tree.rootError)}
          </div>
        ) : tree.rootLoading && tree.data.length === 0 ? (
          <div className="grid flex-1 place-items-center">
            <Loader />
          </div>
        ) : (
          <ProjectTree
            collapseNonce={tree.collapseNonce}
            cwd={tree.effectiveCwd}
            data={tree.data}
            onActivateFile={openIdeFile}
            onActivateFolder={() => undefined}
            onLoadChildren={tree.loadChildren}
            onNodeOpenChange={tree.setNodeOpen}
            onPreviewFile={openIdeFile}
            openState={tree.openState}
          />
        )}
      </div>
    </section>
  )
}
