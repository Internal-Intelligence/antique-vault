import { ReactNode } from "react";

export function IosModal({ children, onClose }: { children: ReactNode; onClose: () => void }) {
  return (
    <div className="ios-modal-backdrop" onClick={onClose}>
      <div className="ios-modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="ios-sheet-grabber" aria-hidden />
        <button type="button" className="ios-modal-close" onClick={onClose} aria-label="Close">
          ×
        </button>
        {children}
      </div>
    </div>
  );
}

export function IosRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="ios-row">
      <span className="ios-row-label">{label}</span>
      <span className="ios-row-value">{value}</span>
    </div>
  );
}