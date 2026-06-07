import { RefreshCw, Unplug, X } from "lucide-react";
import { useState } from "react";

type Props = {
  localAddress: string;
  peerAddress: string;
  syncKey: string;
  syncing: boolean;
  error: string;
  onClose: () => void;
  onPeerAddressChange: (address: string) => void;
  onSyncKeyChange: (key: string) => void;
  onSync: (address: string) => void;
};

export function SyncDialog({ localAddress, peerAddress, syncKey, syncing, error, onClose, onPeerAddressChange, onSyncKeyChange, onSync }: Props) {
  const [address, setAddress] = useState(peerAddress);

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="share-dialog" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
        <header>
          <div className="share-icon"><RefreshCw size={20} /></div>
          <div>
            <span className="eyebrow">No account or server</span>
            <h2>Sync devices</h2>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close sync dialog"><X size={18} /></button>
        </header>

        <div className="share-content sync-content">
          <p>Keep this app running on both devices. Enter the other device's address once; md-notes retries it automatically.</p>
          <label>
            This device
            <input className="sync-address" readOnly value={localAddress || "Starting local sync…"} />
          </label>
          <label>
            Other device
            <input
              className="sync-address"
              placeholder="192.168.1.20:45123"
              value={address}
              onChange={(event) => setAddress(event.target.value)}
            />
          </label>
          <label>
            Pairing key (use the same key on both devices)
            <input
              className="sync-address"
              value={syncKey}
              onChange={(event) => onSyncKeyChange(event.target.value.trim())}
            />
          </label>
          {error && <p className="sync-error"><Unplug size={14} /> {error}</p>}
          <button
            className="primary-button"
            disabled={syncing || !address.trim()}
            onClick={() => {
              const nextAddress = address.trim();
              onPeerAddressChange(nextAddress);
              onSync(nextAddress);
            }}
          >
            <RefreshCw size={17} className={syncing ? "spinning" : ""} />
            {syncing ? "Connecting…" : "Sync now"}
          </button>
          <small>Across the internet, the address must be reachable through Tailscale or port forwarding.</small>
        </div>
      </section>
    </div>
  );
}
