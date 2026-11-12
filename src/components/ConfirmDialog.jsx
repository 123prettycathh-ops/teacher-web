export default function ConfirmDialog({ title, message, actions }) {
  return (
    <div className="dlg-overlay">
      <div className="dlg" role="dialog" aria-modal="true">
        <h3>{title}</h3>
        <p>{message}</p>
        <div className="dlg-actions">
          {actions.map((a) => (
            <button key={a.label} type="button" onClick={a.onClick}>{a.label}</button>
          ))}
        </div>
      </div>
    </div>
  );
}