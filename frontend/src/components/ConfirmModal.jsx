import { useEffect } from 'react';

export default function ConfirmModal({ show, title, message, onConfirm, onCancel, confirmLabel = 'Delete', confirmColor = 'danger' }) {
  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') onCancel(); };
    if (show) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [show, onCancel]);

  if (!show) return null;

  return (
    <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={onCancel}>
      <div className="modal-dialog modal-dialog-centered modal-sm" onClick={e => e.stopPropagation()}>
        <div className="modal-content p-4">
          <h6 className="fw-semibold mb-2">{title || 'Confirm'}</h6>
          <p className="text-muted small mb-4">{message || 'Are you sure?'}</p>
          <div className="d-flex gap-2">
            <button className={`btn btn-${confirmColor} flex-grow-1 btn-sm`} onClick={onConfirm}>{confirmLabel}</button>
            <button className="btn btn-secondary flex-grow-1 btn-sm" onClick={onCancel}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}
