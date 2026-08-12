// Filter option lists, built from the label maps.
//
// Deriving them means a new status can never appear in the domain without appearing in its filter,
// which is the usual way a filter quietly stops being able to reach part of the data.

import {
  activityActorTypeLabels,
  activityCategoryLabels,
  alertCategoryLabels,
  alertSeverityLabels,
  alertStatusFacetLabels,
  alertStatusLabels,
  bookingStatusLabels,
  courtLabels,
  invoiceStatusLabels,
  memberStatusLabels,
  membershipTypeLabels,
  paymentMetaClassLabels,
  paymentProviderLabels,
  paymentStatusLabels,
  reconciliationIssueLabels,
  reconciliationSeverityLabels,
  voucherStatusLabels,
} from './labels';
import {
  activityActorTypes,
  activityCategories,
  alertCategories,
  alertSeverities,
  alertStatuses,
  bookingStatuses,
  courtKeys,
  invoiceStatuses,
  memberStatuses,
  membershipTypes,
  paymentMetaClasses,
  paymentProviders,
  paymentStatuses,
  reconciliationIssues,
  reconciliationSeverities,
  voucherStatuses,
} from './types';

export interface Option {
  value: string;
  label: string;
}

function withAll<T extends string>(
  allLabel: string,
  values: readonly T[],
  labels: Record<T, string>,
): Option[] {
  return [{ value: 'all', label: allLabel }, ...values.map((value) => ({ value, label: labels[value] }))];
}

export const bookingStatusOptions = withAll('Alle Status', bookingStatuses, bookingStatusLabels);
export const courtOptions = withAll('Alle Plätze', courtKeys, courtLabels);
export const paymentProviderOptions = withAll('Alle Zahlungswege', paymentProviders, paymentProviderLabels);
export const paymentStatusOptions = withAll('Alle Status', paymentStatuses, paymentStatusLabels);
export const paymentMetaClassOptions = withAll('Alle Vorgänge', paymentMetaClasses, paymentMetaClassLabels);
export const invoiceStatusOptions = withAll('Alle Status', invoiceStatuses, invoiceStatusLabels);
export const reconciliationIssueOptions = withAll('Alle Befunde', reconciliationIssues, reconciliationIssueLabels);
export const reconciliationSeverityOptions = withAll('Alle Schweregrade', reconciliationSeverities, reconciliationSeverityLabels);
export const voucherStatusOptions = withAll('Alle Status', voucherStatuses, voucherStatusLabels);
export const membershipTypeOptions = withAll('Alle Mitgliedschaften', membershipTypes, membershipTypeLabels);
export const memberStatusOptions = withAll('Alle Status', memberStatuses, memberStatusLabels);
export const activityCategoryOptions = withAll('Alle Kategorien', activityCategories, activityCategoryLabels);
export const activityActorTypeOptions = withAll('Alle Akteure', activityActorTypes, activityActorTypeLabels);
export const alertSeverityOptions = withAll('Alle Schweregrade', alertSeverities, alertSeverityLabels);
/**
 * Alert status, with the synthetic `unresolved` union offered directly after "Alle".
 *
 * Placed second because it is the filter triage actually wants: the reader almost always means
 * "still outstanding" rather than the narrower "not yet picked up".
 */
export const alertStatusOptions: Option[] = [
  { value: 'all', label: 'Alle Status' },
  { value: 'unresolved', label: alertStatusFacetLabels.unresolved },
  ...alertStatuses.map((value) => ({ value, label: alertStatusLabels[value] })),
];
export const alertCategoryOptions = withAll('Alle Kategorien', alertCategories, alertCategoryLabels);
