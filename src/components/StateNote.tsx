import "./StateNote.css";

export function Loading({ label = "読み込み中…" }: { label?: string }) {
  return (
    <p className="state-note" role="status">
      {label}
    </p>
  );
}

export function ErrorNote({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <p className="state-note state-error" role="alert">
      {message}
      {onRetry && (
        <>
          <br />
          <button className="state-retry" type="button" onClick={onRetry}>
            もう一度読み込む
          </button>
        </>
      )}
    </p>
  );
}
