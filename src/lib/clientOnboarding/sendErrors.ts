// Re-export: the canonical module lives with the Edge Functions so the deployed function and the
// owner preview use the SAME code without a cross-directory import in the function bundle.
export * from '../../../supabase/functions/_shared/clientOnboarding/sendErrors';
