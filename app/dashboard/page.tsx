import { ContactsView } from '@/components/contacts-view'

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Contacts</h1>
        <p className="text-muted-foreground">
          Manage and export your assigned contacts
        </p>
      </div>
      <ContactsView />
    </div>
  )
}
