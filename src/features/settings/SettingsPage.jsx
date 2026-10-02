/**
 * Configuración: companies & locals, worker groups, gestoría emails (alta and PRL).
 */
import { useState } from 'react';
import { Segmented } from '@/components/ui';
import { CompaniesSettings } from './CompaniesSettings';
import { GroupsSettings } from './GroupsSettings';
import { GestoriaSettings } from './GestoriaSettings';

const TABS = [
  { value: 'empresas', label: 'Empresas y locales', Component: CompaniesSettings },
  { value: 'grupos', label: 'Grupos', Component: GroupsSettings },
  { value: 'gestoria', label: 'Alta gestoría', Component: () => <GestoriaSettings kind="alta" /> },
  { value: 'prl', label: 'Solicitud PRL', Component: () => <GestoriaSettings kind="prl" /> },
];

export function SettingsPage() {
  const [tab, setTab] = useState('empresas');
  const Active = TABS.find((t) => t.value === tab).Component;
  return (
    <div className="page" style={{ maxWidth: 980 }}>
      <h1 className="page-title">Configuración</h1>
      <div style={{ alignSelf: 'flex-start', maxWidth: '100%' }}>
        <Segmented value={tab} onChange={setTab} options={TABS} />
      </div>
      <Active />
    </div>
  );
}
