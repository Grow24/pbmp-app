import type { ReactNode } from 'react'
import { AppBar, Layout as RALayout, TitlePortal } from 'react-admin'
import { AppMenu } from './Menu'

function AppManagerBar() {
  return (
    <AppBar>
      <TitlePortal />
      <span style={{ flex: 1 }} />
      <a href="/" style={{ color: 'inherit', fontSize: 13, fontWeight: 500, marginRight: 16, textDecoration: 'none' }}>
        Back to workbench
      </a>
    </AppBar>
  )
}

export const Layout = ({ children }: { children: ReactNode }) => (
  <RALayout menu={AppMenu} appBar={AppManagerBar}>
    {children}
  </RALayout>
)
