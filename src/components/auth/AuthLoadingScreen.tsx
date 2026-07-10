export function AuthLoadingScreen() {
  return (
    <div className="min-h-screen bg-white text-gray-900 flex items-center justify-center px-6">
      <div className="flex items-center gap-3 text-sm text-gray-500">
        <span className="h-4 w-4 rounded-full border border-gray-300 border-t-gray-900 animate-spin" />
        Checking secure session
      </div>
    </div>
  );
}
