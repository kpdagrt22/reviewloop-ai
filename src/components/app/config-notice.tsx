export function ConfigNotice({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
      <p className="font-medium text-yellow-900">{title}</p>
      <p className="mt-1 text-sm text-yellow-800">{body}</p>
    </div>
  );
}
