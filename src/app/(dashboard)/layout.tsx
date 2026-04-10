import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/Sidebar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Sidebar
        role={profile?.role ?? 'user'}
        fullName={profile?.full_name ?? ''}
      />
      <div className="main-content" style={{ 
        marginLeft: profile?.role === 'admin' ? '250px' : '0', 
        transition: 'margin-left 0.3s ease', 
        padding: '0',
        minWidth: 0,
        overflowX: 'hidden',
        width: profile?.role === 'admin' ? 'calc(100vw - 250px)' : '100vw',
        maxWidth: '100%',
        boxSizing: 'border-box',
      }}>
        {children}
      </div>
    </div>
  )
}
