import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, Check, ChevronDown, Plus, RefreshCw, ShieldCheck, Sparkles, X } from 'lucide-react';

import { AdminCard, Pill, invitationTone } from '@/pages/admin/clients/adminUi';
import { effectiveInvitationStatus } from '@/lib/clientPlatform/invitationStatus';
import { capabilityLabel } from '@/lib/portalAccess/capabilities';
import {
  applySportsClubRolePresets,
  assignMemberRole,
  loadOrganizationAccessOverview,
  removeMemberRole,
  setInvitationRoles,
  type AccessInvitation,
  type AccessMember,
  type AccessRole,
  type OrganizationAccessOverview,
} from '@/lib/clientPlatform/accessAdminApi';
import { cn } from '@/lib/utils';

const organizationRoleLabels: Record<string, string> = {
  owner: 'Inhaber',
  admin: 'Administrator',
  member: 'Mitglied',
  viewer: 'Leser',
};

const membershipStatusTone: Record<string, 'neutral' | 'success' | 'warning' | 'danger' | 'info'> = {
  active: 'success',
  invited: 'info',
  suspended: 'danger',
};

const membershipStatusLabels: Record<string, string> = {
  active: 'Aktiv',
  invited: 'Eingeladen',
  suspended: 'Gesperrt',
};

/**
 * "Zugriff & Rollen" — the owner surface for the reusable authorization model.
 *
 * Everything here goes through the SECURITY DEFINER RPCs in accessAdminApi. There is no raw table
 * mutation from the browser, and the RPCs re-authorize the caller as a platform admin regardless of
 * what this component renders.
 */
export function AccessRolesSection({ organizationId }: { organizationId: string }) {
  const [overview, setOverview] = useState<OrganizationAccessOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [confirmRemoval, setConfirmRemoval] = useState<{
    member: AccessMember;
    role: AccessRole;
  } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setOverview(await loadOrganizationAccessOverview(organizationId));
      setError(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    void load();
  }, [load]);

  const flash = useCallback((tone: 'success' | 'error', message: string) => {
    setNotice({ tone, message });
    window.setTimeout(() => setNotice(null), 4000);
  }, []);

  const rolesById = useMemo(() => {
    const map = new Map<string, AccessRole>();
    for (const role of overview?.roles ?? []) map.set(role.id, role);
    return map;
  }, [overview]);

  const runAssign = async (member: AccessMember, roleId: string) => {
    const key = `${member.membership_id}:${roleId}`;
    setBusyKey(key);
    const { error: err } = await assignMemberRole(member.membership_id, roleId);
    setBusyKey(null);
    if (err) {
      flash('error', `Rolle konnte nicht zugewiesen werden: ${err}`);
      return;
    }
    flash('success', `Rolle „${rolesById.get(roleId)?.label ?? 'Rolle'}“ zugewiesen.`);
    await load();
  };

  const runRemove = async (member: AccessMember, role: AccessRole) => {
    const key = `${member.membership_id}:${role.id}`;
    setConfirmRemoval(null);
    setBusyKey(key);
    const { error: err } = await removeMemberRole(member.membership_id, role.id);
    setBusyKey(null);
    if (err) {
      flash('error', `Rolle konnte nicht entfernt werden: ${err}`);
      return;
    }
    flash('success', `Rolle „${role.label}“ entzogen.`);
    await load();
  };

  const runInvitationRoles = async (invitation: AccessInvitation, roleIds: string[]) => {
    setBusyKey(`inv:${invitation.id}`);
    const { error: err } = await setInvitationRoles(invitation.id, roleIds);
    setBusyKey(null);
    if (err) {
      flash('error', `Rollen der Einladung konnten nicht gespeichert werden: ${err}`);
      return;
    }
    flash('success', `Rollen für ${invitation.email} gespeichert.`);
    await load();
  };

  const runPresets = async () => {
    setBusyKey('presets');
    const { error: err } = await applySportsClubRolePresets(organizationId);
    setBusyKey(null);
    if (err) {
      flash('error', `Rollenvorlagen konnten nicht angelegt werden: ${err}`);
      return;
    }
    flash('success', 'Vereins-Rollenvorlagen angelegt. Es wurde niemandem eine Rolle zugewiesen.');
    await load();
  };

  if (loading) {
    return (
      <div aria-label="Zugriff und Rollen werden geladen" className="space-y-3">
        <div className="h-24 animate-pulse rounded-2xl border border-gray-100 bg-white" />
        <div className="h-40 animate-pulse rounded-2xl border border-gray-100 bg-white" />
      </div>
    );
  }

  if (error || !overview) {
    return (
      <AdminCard>
        <div role="alert">
          <p className="text-sm font-semibold text-gray-900">Zugriff & Rollen konnten nicht geladen werden</p>
          <p className="mt-1 text-[13px] text-gray-500">{error ?? 'Unbekannter Fehler.'}</p>
          <button
            type="button"
            onClick={() => void load()}
            className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 text-[13px] font-semibold text-gray-700 hover:border-gray-300"
          >
            <RefreshCw size={14} aria-hidden="true" /> Erneut versuchen
          </button>
        </div>
      </AdminCard>
    );
  }

  const pendingInvitations = overview.invitations.filter(
    (invitation) => effectiveInvitationStatus(invitation) === 'pending'
  );

  return (
    <div className="space-y-4">
      {notice ? (
        <div
          role="status"
          className={cn(
            'rounded-xl border px-4 py-2.5 text-sm',
            notice.tone === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-red-200 bg-red-50 text-red-800'
          )}
        >
          {notice.message}
        </div>
      ) : null}

      <RolesCard roles={overview.roles} onApplyPresets={() => void runPresets()} busy={busyKey === 'presets'} />

      <AdminCard>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-gray-400">
            Mitglieder ({overview.members.length})
          </p>
          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 text-[13px] font-semibold text-gray-700 hover:border-gray-300 lg:min-h-9"
          >
            <RefreshCw size={14} aria-hidden="true" /> Aktualisieren
          </button>
        </div>

        {overview.members.length === 0 ? (
          <p className="text-sm text-gray-500">
            Diese Organisation hat noch keine Mitglieder. Sobald eine Einladung angenommen wird,
            erscheinen die Mitglieder hier.
          </p>
        ) : (
          <ul className="space-y-3">
            {overview.members.map((member) => (
              <MemberRow
                key={member.membership_id}
                member={member}
                roles={overview.roles}
                rolesById={rolesById}
                busyKey={busyKey}
                onAssign={(roleId) => void runAssign(member, roleId)}
                onRequestRemove={(role) => setConfirmRemoval({ member, role })}
              />
            ))}
          </ul>
        )}
      </AdminCard>

      <AdminCard>
        <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.14em] text-gray-400">
          Offene Einladungen ({pendingInvitations.length})
        </p>
        {pendingInvitations.length === 0 ? (
          <p className="text-sm text-gray-500">
            Keine offenen Einladungen. Rollen lassen sich nur für noch nicht angenommene Einladungen
            vorkonfigurieren.
          </p>
        ) : (
          <ul className="space-y-3">
            {pendingInvitations.map((invitation) => (
              <InvitationRow
                key={invitation.id}
                invitation={invitation}
                roles={overview.roles}
                rolesById={rolesById}
                busy={busyKey === `inv:${invitation.id}`}
                onSave={(roleIds) => void runInvitationRoles(invitation, roleIds)}
              />
            ))}
          </ul>
        )}
      </AdminCard>

      <p className="text-[12px] leading-relaxed text-gray-400">
        Rollen und Berechtigungen werden ausschließlich über gesicherte Datenbank-Funktionen
        geändert. Das Ausblenden von Bedienelementen ist keine Sicherheitsgrenze — der Server prüft
        jede Berechtigung unabhängig erneut.
      </p>

      {confirmRemoval ? (
        <RemovalDialog
          member={confirmRemoval.member}
          role={confirmRemoval.role}
          onCancel={() => setConfirmRemoval(null)}
          onConfirm={() => void runRemove(confirmRemoval.member, confirmRemoval.role)}
        />
      ) : null}
    </div>
  );
}

function RolesCard({
  roles,
  onApplyPresets,
  busy,
}: {
  roles: AccessRole[];
  onApplyPresets: () => void;
  busy: boolean;
}) {
  return (
    <AdminCard>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-gray-400">
          Funktionsrollen ({roles.length})
        </p>
        <button
          type="button"
          onClick={onApplyPresets}
          disabled={busy}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 text-[13px] font-semibold text-gray-700 hover:border-gray-300 disabled:opacity-50 lg:min-h-9"
        >
          <Sparkles size={14} aria-hidden="true" /> Vereins-Vorlagen anlegen
        </button>
      </div>

      {roles.length === 0 ? (
        <p className="text-sm text-gray-500">
          Für diese Organisation sind noch keine Funktionsrollen definiert. Die coarse
          Organisationsrolle (Inhaber, Administrator, Mitglied, Leser) bleibt davon unberührt.
        </p>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {roles.map((role) => (
            <li key={role.id} className="rounded-xl border border-gray-100 bg-gray-50/60 p-4">
              <p className="text-sm font-semibold text-gray-900">{role.label}</p>
              {role.description ? (
                <p className="mt-0.5 text-[12px] leading-5 text-gray-500">{role.description}</p>
              ) : null}
              <details className="mt-2">
                <summary className="cursor-pointer text-[12px] font-semibold text-gray-600 hover:text-gray-950">
                  {role.capabilities.length} Berechtigungen anzeigen
                </summary>
                <ul className="mt-2 space-y-1">
                  {role.capabilities.map((key) => (
                    <li key={key} className="flex items-start gap-1.5 text-[12px] text-gray-600">
                      <Check size={12} className="mt-0.5 shrink-0 text-emerald-600" aria-hidden="true" />
                      <span>
                        {capabilityLabel(key)}{' '}
                        <span className="font-mono text-[11px] text-gray-400">{key}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </details>
            </li>
          ))}
        </ul>
      )}
    </AdminCard>
  );
}

function MemberRow({
  member,
  roles,
  rolesById,
  busyKey,
  onAssign,
  onRequestRemove,
}: {
  member: AccessMember;
  roles: AccessRole[];
  rolesById: Map<string, AccessRole>;
  busyKey: string | null;
  onAssign: (roleId: string) => void;
  onRequestRemove: (role: AccessRole) => void;
}) {
  const assigned = member.role_ids
    .map((id) => rolesById.get(id))
    .filter((role): role is AccessRole => role !== undefined);
  const assignable = roles.filter((role) => !member.role_ids.includes(role.id));

  return (
    <li className="rounded-xl border border-gray-100 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-gray-900">
            {member.full_name || member.email || member.user_id}
          </p>
          <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[12px] text-gray-500">
            {member.email ? <span className="truncate">{member.email}</span> : null}
            <Pill
              label={organizationRoleLabels[member.organization_role] ?? member.organization_role}
              tone="info"
            />
            <Pill
              label={membershipStatusLabels[member.membership_status] ?? member.membership_status}
              tone={membershipStatusTone[member.membership_status] ?? 'neutral'}
            />
          </p>
        </div>
        <AssignRoleMenu
          controlId={`assign-${member.membership_id}`}
          roles={assignable}
          disabled={assignable.length === 0}
          onSelect={onAssign}
        />
      </div>

      <div className="mt-3">
        {assigned.length === 0 ? (
          <p className="text-[12px] text-gray-500">
            Keine Funktionsrolle zugewiesen — dieses Mitglied erhält die allgemeine Portal-Grundausstattung.
          </p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {assigned.map((role) => (
              <li key={role.id}>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white py-0.5 pl-3 pr-0.5 text-[12px] font-semibold text-gray-700 lg:py-1 lg:pr-1">
                  {role.label}
                  <button
                    type="button"
                    onClick={() => onRequestRemove(role)}
                    disabled={busyKey === `${member.membership_id}:${role.id}`}
                    aria-label={`Rolle ${role.label} entfernen`}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full text-gray-400 lg:h-6 lg:w-6 transition-colors hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 disabled:opacity-50"
                  >
                    <X size={13} aria-hidden="true" />
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {member.effective_capabilities.length > 0 ? (
        <details className="mt-3">
          <summary className="cursor-pointer text-[12px] font-semibold text-gray-600 hover:text-gray-950">
            Effektive Berechtigungen ({member.effective_capabilities.length})
          </summary>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {member.effective_capabilities.map((key) => (
              <li
                key={key}
                className="rounded-md border border-gray-100 bg-gray-50 px-2 py-0.5 font-mono text-[11px] text-gray-600"
              >
                {key}
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </li>
  );
}

/**
 * Accessible role picker. A real <button> with aria-haspopup/aria-expanded, a listbox of options,
 * Escape to close, and outside-click dismissal — no hover-only affordance, and every target is at
 * least 44px tall so it works on a phone.
 */
function AssignRoleMenu({
  controlId,
  roles,
  disabled,
  onSelect,
}: {
  controlId: string;
  roles: AccessRole[];
  disabled: boolean;
  onSelect: (roleId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative shrink-0">
      <button
        type="button"
        id={controlId}
        disabled={disabled}
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 text-[13px] font-semibold text-gray-700 transition-colors hover:border-gray-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 disabled:opacity-50 sm:w-auto"
      >
        <Plus size={14} aria-hidden="true" /> Rolle zuweisen
        <ChevronDown size={13} className="text-gray-400" aria-hidden="true" />
      </button>

      {open ? (
        <div
          role="listbox"
          aria-labelledby={controlId}
          className="absolute right-0 z-20 mt-2 max-h-72 w-full min-w-[240px] overflow-y-auto rounded-2xl border border-gray-200 bg-white p-2 shadow-[0_18px_60px_rgba(15,23,42,0.14)] sm:w-72"
        >
          {roles.map((role) => (
            <button
              key={role.id}
              type="button"
              role="option"
              aria-selected={false}
              onClick={() => {
                setOpen(false);
                onSelect(role.id);
              }}
              className="flex min-h-11 w-full flex-col items-start gap-0.5 rounded-xl px-3 py-2 text-left transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
            >
              <span className="text-[13px] font-semibold text-gray-900">{role.label}</span>
              <span className="text-[11px] text-gray-500">{role.capabilities.length} Berechtigungen</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/** Multi-selection of functional roles for a pending invitation. */
function InvitationRow({
  invitation,
  roles,
  rolesById,
  busy,
  onSave,
}: {
  invitation: AccessInvitation;
  roles: AccessRole[];
  rolesById: Map<string, AccessRole>;
  busy: boolean;
  onSave: (roleIds: string[]) => void;
}) {
  const [selected, setSelected] = useState<string[]>(invitation.role_ids);

  // Re-sync when the overview reloads, so a saved change is reflected rather than shadowed by
  // stale local state.
  useEffect(() => {
    setSelected(invitation.role_ids);
  }, [invitation.role_ids]);

  const dirty =
    selected.length !== invitation.role_ids.length ||
    selected.some((id) => !invitation.role_ids.includes(id));

  const toggle = (roleId: string) => {
    setSelected((current) =>
      current.includes(roleId) ? current.filter((id) => id !== roleId) : [...current, roleId]
    );
  };

  const status = effectiveInvitationStatus(invitation);

  return (
    <li className="rounded-xl border border-gray-100 p-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <p className="truncate text-sm font-semibold text-gray-900">
          {invitation.email} <Pill label={status} tone={invitationTone[status]} />
        </p>
        <p className="text-[12px] text-gray-500">
          Organisationsrolle: {organizationRoleLabels[invitation.organization_role] ?? invitation.organization_role}
        </p>
      </div>

      <fieldset className="mt-3">
        <legend className="mb-2 text-[12px] font-semibold text-gray-600">
          Funktionsrollen bei Registrierung zuweisen
        </legend>
        {roles.length === 0 ? (
          <p className="text-[12px] text-gray-500">
            Für diese Organisation sind noch keine Funktionsrollen definiert.
          </p>
        ) : (
          <div className="grid gap-1.5 sm:grid-cols-2">
            {roles.map((role) => {
              const checked = selected.includes(role.id);
              return (
                <label
                  key={role.id}
                  className={cn(
                    'flex min-h-11 cursor-pointer items-center gap-2.5 rounded-xl border px-3 py-2 transition-colors',
                    checked ? 'border-gray-900 bg-gray-50' : 'border-gray-200 bg-white hover:border-gray-300'
                  )}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(role.id)}
                    className="h-4 w-4 rounded border-gray-300 text-gray-900 focus-visible:ring-2 focus-visible:ring-gray-400"
                  />
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] font-semibold text-gray-900">{role.label}</span>
                    <span className="block text-[11px] text-gray-500">
                      {rolesById.get(role.id)?.capabilities.length ?? 0} Berechtigungen
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
        )}
      </fieldset>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => onSave(selected)}
          disabled={busy || !dirty || roles.length === 0}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-gray-950 px-4 text-sm font-semibold text-white transition-colors hover:bg-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 disabled:opacity-50"
        >
          <ShieldCheck size={15} aria-hidden="true" />
          {busy ? 'Wird gespeichert…' : 'Rollen speichern'}
        </button>
        {dirty ? <span className="text-[12px] text-amber-700">Nicht gespeicherte Änderungen</span> : null}
      </div>
    </li>
  );
}

/** Explicit confirmation before access is taken away. */
function RemovalDialog({
  member,
  role,
  onCancel,
  onConfirm,
}: {
  member: AccessMember;
  role: AccessRole;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onCancel]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-gray-950/40 p-4 sm:items-center">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="access-removal-title"
        className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.24)]"
      >
        <div className="mb-3 flex items-start gap-3">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
            <AlertTriangle size={18} aria-hidden="true" />
          </span>
          <div>
            <h2 id="access-removal-title" className="text-base font-semibold text-gray-950">
              Zugriff entziehen?
            </h2>
            <p className="mt-1 text-[13px] leading-6 text-gray-600">
              Die Rolle <strong>{role.label}</strong> wird{' '}
              <strong>{member.full_name || member.email || 'diesem Mitglied'}</strong> entzogen. Die
              damit verbundenen Berechtigungen entfallen sofort. Mitgliedschaft, Profil und
              Geschäftsdaten bleiben unverändert.
            </p>
          </div>
        </div>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row-reverse">
          <button
            type="button"
            onClick={onConfirm}
            className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl bg-red-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2"
          >
            Zugriff entziehen
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 transition-colors hover:border-gray-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
          >
            Abbrechen
          </button>
        </div>
      </div>
    </div>
  );
}
