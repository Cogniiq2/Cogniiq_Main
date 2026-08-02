export function AuthLoadingScreen() {
  return (
    <div data-cq-surface="auth" className="flex min-h-screen items-center justify-center bg-white px-6 text-gray-900">
      <div role="status" className="flex items-center gap-3 text-sm text-gray-600">
        <span
          className="h-4 w-4 animate-spin rounded-full border-2 border-gray-200 border-t-gray-900 motion-reduce:animate-none"
          aria-hidden="true"
        />
        Checking secure session
      </div>
    </div>
  );
}
