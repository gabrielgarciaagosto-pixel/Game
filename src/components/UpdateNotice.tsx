import { useEffect, useState } from 'react';
import {
  checkForUpdate,
  openUpdateDownload,
  silenceUpdateNotice,
  type VersionOffer,
} from '../update/versionFeed';

/**
 * One quiet card when version.json is newer than this install.
 * The rest of the screen still takes taps. No network, no card.
 */
export function UpdateNotice() {
  const [offer, setOffer] = useState<VersionOffer | null>(null);

  useEffect(() => {
    let live = true;
    void checkForUpdate().then((next) => {
      if (live) setOffer(next);
    });
    return () => {
      live = false;
    };
  }, []);

  useEffect(() => {
    if (!offer) return;
    const close = () => {
      silenceUpdateNotice();
      setOffer(null);
    };
    window.__ossuarianCloseUpdate = close;
    return () => {
      if (window.__ossuarianCloseUpdate === close) {
        delete window.__ossuarianCloseUpdate;
      }
    };
  }, [offer]);

  if (!offer) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 z-[10060] flex justify-center px-4"
      style={{ top: 'calc(var(--safe-top) + 0.7rem)' }}
    >
      <div
        data-update-notice
        role="dialog"
        aria-label="Update"
        className="pointer-events-auto w-full max-w-sm rounded-2xl border border-[#3a3228] bg-[#12100e] px-4 py-3 text-left text-[#ebe6dd] shadow-2xl"
      >
        <p className="text-[10px] uppercase tracking-[0.22em] text-[#c4a574]">
          House notice
        </p>
        <p
          className="mt-1 text-[15px] leading-snug text-[#f3eadc]"
          style={{ fontFamily: 'Cinzel, Georgia, serif' }}
        >
          A new update for Ossuarian is out.
        </p>
        {offer.notes ? (
          <p className="mt-1.5 text-[12px] leading-snug text-[#b7ab9c]">{offer.notes}</p>
        ) : null}
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            data-update-download
            className="flex-1 rounded-lg bg-[#c4a574] py-2 text-sm font-bold text-[#1a140e]"
            onClick={() => {
              openUpdateDownload(offer.apkUrl);
              silenceUpdateNotice();
              setOffer(null);
            }}
          >
            Download
          </button>
          <button
            type="button"
            data-update-later
            className="flex-1 rounded-lg border border-[#6e5a3a] py-2 text-sm text-[#ebe6dd]"
            onClick={() => {
              silenceUpdateNotice();
              setOffer(null);
            }}
          >
            Later
          </button>
        </div>
      </div>
    </div>
  );
}
