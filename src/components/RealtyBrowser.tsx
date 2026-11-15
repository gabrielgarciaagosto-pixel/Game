import React, { useMemo, useState } from 'react';
import {
  PROPERTY_STATE_CODES,
  filterPropertiesByState,
  getPropertyById,
  type PropertyListing,
} from '../data/bankProducts';
import { US_JURISDICTIONS } from '../data/usPlaces';
import { useGameStore } from '../store/useGameStore';
import { TapButton } from './TapButton';
import { useSheetOpen } from './useSheetOpen';

/** Deterministic faux “photo” gradients for offline/Android. */
function listingPhotoStyle(listing: PropertyListing): React.CSSProperties {
  let h = 0;
  for (let i = 0; i < listing.id.length; i++) {
    h = (h * 31 + listing.id.charCodeAt(i)) >>> 0;
  }
  const hue = h % 360;
  const hue2 = (hue + 40 + (h % 30)) % 360;
  return {
    backgroundImage: `
      linear-gradient(160deg, hsla(${hue}, 28%, 22%, 0.92), hsla(${hue2}, 35%, 14%, 0.95)),
      repeating-linear-gradient(
        90deg,
        transparent,
        transparent 18px,
        rgba(255,255,255,0.04) 18px,
        rgba(255,255,255,0.04) 19px
      ),
      radial-gradient(ellipse at 30% 20%, rgba(255,255,255,0.18), transparent 55%)
    `,
  };
}

/**
 * Lychgate Commercial Realty — classic funeral-home listings site.
 * Purchase cash/mortgage routes through First National financing.
 */
export const RealtyBrowser: React.FC = () => {
  const cash = useGameStore((s) => s.cash);
  const ownedProperty = useGameStore((s) => s.ownedProperty);
  const facilitySpaceUsed = useGameStore((s) => s.facilitySpaceUsed);
  const buyProperty = useGameStore((s) => s.buyProperty);
  const setComputerOpenApp = useGameStore((s) => s.setComputerOpenApp);

  const [stateFilter, setStateFilter] = useState<string>('ALL');
  const [detailId, setDetailId] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<{
    title: string;
    body: string;
    action: () => void;
  } | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [contactedId, setContactedId] = useState<string | null>(null);
  useSheetOpen(confirm != null);

  const used = facilitySpaceUsed();
  const listings = useMemo(
    () => filterPropertiesByState(stateFilter === 'ALL' ? 'ALL' : stateFilter),
    [stateFilter]
  );
  const detail = detailId ? getPropertyById(detailId) ?? null : null;

  const runConfirm = (
    title: string,
    body: string,
    action: () => { ok: boolean; message: string }
  ) => {
    setConfirm({
      title,
      body,
      action: () => {
        const r = action();
        setFlash(r.message);
        setConfirm(null);
        if (r.ok) setDetailId(null);
      },
    });
  };

  return (
    <div
      className="h-full flex flex-col overflow-hidden text-[#1c1814]"
      style={{
        fontFamily: '"Source Sans 3", "Segoe UI", sans-serif',
        background: 'linear-gradient(180deg, #f4efe6 0%, #e8dfd0 100%)',
      }}
    >
      <header className="shrink-0 border-b border-[#c4b49a] bg-[#faf6ef] px-3 py-3">
        <p
          className="text-[10px] tracking-[0.28em] uppercase text-[#8a6b3d]"
          style={{ fontFamily: '"Libre Baskerville", Georgia, serif' }}
        >
          Est. 1891 · Licensed commercial
        </p>
        <h2
          className="text-xl font-bold text-[#2a2118] leading-tight"
          style={{ fontFamily: '"Libre Baskerville", Georgia, serif' }}
        >
          Lychgate Commercial Realty
        </h2>
        <p className="text-[11px] text-[#5c5348] mt-0.5">
          Funeral homes &amp; chapels for sale · Financing via First National
        </p>
        <div className="mt-2 flex flex-wrap gap-2 text-[10px]">
          <span className="px-2 py-0.5 rounded border border-[#c4b49a] bg-white/70">
            Cash ${cash.toLocaleString()}
          </span>
          <span className="px-2 py-0.5 rounded border border-[#c4b49a] bg-white/70">
            Your pad: {ownedProperty.city}, {ownedProperty.stateCode} · space{' '}
            {used}/{ownedProperty.spaceTotal}
          </span>
        </div>
      </header>

      <main className="flex-1 min-h-0 overflow-y-auto p-3 space-y-3 pb-16">
        {flash && (
          <div className="rounded border border-[#8a6b3d]/50 bg-[#fff8e8] px-3 py-2 text-[12px] text-[#5c4020]">
            {flash}
          </div>
        )}

        {!detail && (
          <>
            <div className="flex items-center gap-2 bg-white/80 border border-[#d2c4ae] rounded-lg px-2 py-2">
              <label
                className="text-[11px] text-[#5c5348] shrink-0"
                style={{ fontFamily: '"Libre Baskerville", Georgia, serif' }}
              >
                State
              </label>
              <select
                value={stateFilter}
                onChange={(e) => setStateFilter(e.target.value)}
                className="flex-1 bg-[#faf6ef] border border-[#c4b49a] rounded px-2 py-1.5 text-[12px]"
              >
                <option value="ALL">All jurisdictions</option>
                {PROPERTY_STATE_CODES.map((code) => {
                  const name =
                    US_JURISDICTIONS.find((j) => j.code === code)?.name ?? code;
                  return (
                    <option key={code} value={code}>
                      {code} — {name}
                    </option>
                  );
                })}
              </select>
            </div>
            <p className="text-[11px] text-[#6a6258]">
              {Math.min(listings.length, 36)} listings
              {stateFilter !== 'ALL' ? ` in ${stateFilter}` : ''} · need ≥{used}{' '}
              space to relocate with current upgrades
            </p>
            <div className="grid grid-cols-1 gap-3">
              {listings.slice(0, 36).map((listing) => (
                <TapButton
                  key={listing.id}
                  onTap={() => setDetailId(listing.id)}
                  className="w-full text-left rounded-lg border border-[#c4b49a] bg-white shadow-sm overflow-hidden active:bg-[#faf6ef]"
                >
                  <div
                    className="h-28 w-full relative"
                    style={listingPhotoStyle(listing)}
                  >
                    <div className="absolute inset-0 flex items-end p-2">
                      <span className="text-[10px] uppercase tracking-wider text-white/90 bg-black/45 px-1.5 py-0.5 rounded">
                        {listing.stateCode} · {listing.space} space
                      </span>
                    </div>
                  </div>
                  <div className="p-3 space-y-1">
                    <div className="flex justify-between gap-2 items-start">
                      <h3
                        className="font-bold text-[#2a2118] leading-snug"
                        style={{
                          fontFamily: '"Libre Baskerville", Georgia, serif',
                        }}
                      >
                        {listing.label}
                      </h3>
                      <span className="shrink-0 font-semibold text-[#6b4e22]">
                        ${listing.price.toLocaleString()}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#5c5348]">
                      {listing.city}, {listing.stateName}
                    </p>
                    <p className="text-[11px] text-[#6a6258] line-clamp-2">
                      {listing.blurb}
                    </p>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-[#7a6f60] pt-1">
                      <span>Client flow ×{listing.clientFlow}</span>
                      <span>Sales ×{listing.salesMult}</span>
                      <span>Rep +{listing.repBonus}</span>
                    </div>
                  </div>
                </TapButton>
              ))}
            </div>
          </>
        )}

        {detail && (
          <section className="space-y-3">
            <TapButton
              onTap={() => setDetailId(null)}
              className="text-[12px] font-semibold text-[#6b4e22]"
            >
              ← Back to listings
            </TapButton>
            <div className="rounded-lg border border-[#c4b49a] bg-white overflow-hidden shadow-sm">
              <div
                className="h-40 w-full"
                style={listingPhotoStyle(detail)}
              />
              <div className="p-4 space-y-3">
                <div>
                  <h3
                    className="text-xl font-bold text-[#2a2118]"
                    style={{
                      fontFamily: '"Libre Baskerville", Georgia, serif',
                    }}
                  >
                    {detail.label}
                  </h3>
                  <p className="text-[13px] text-[#5c5348]">
                    {detail.city}, {detail.stateName} ({detail.stateCode})
                  </p>
                </div>
                <p className="text-[13px] text-[#3d3730] leading-relaxed">
                  {detail.blurb}
                </p>
                <div className="grid grid-cols-2 gap-2 text-[12px] border-y border-[#e4d9c6] py-3">
                  <div>
                    <div className="text-[10px] uppercase text-[#8a7d6c]">
                      Asking
                    </div>
                    <div className="font-bold text-[#6b4e22]">
                      ${detail.price.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase text-[#8a7d6c]">
                      Floor space
                    </div>
                    <div className="font-bold">{detail.space} units</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase text-[#8a7d6c]">
                      Client flow
                    </div>
                    <div className="font-bold">×{detail.clientFlow}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase text-[#8a7d6c]">
                      Sales / tip
                    </div>
                    <div className="font-bold">×{detail.salesMult}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase text-[#8a7d6c]">
                      Reputation
                    </div>
                    <div className="font-bold">+{detail.repBonus}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase text-[#8a7d6c]">
                      Your need
                    </div>
                    <div className="font-bold">
                      {used} used
                      {used > detail.space ? ' · too small' : ' · fits'}
                    </div>
                  </div>
                </div>
                <p className="text-[11px] text-[#6a6258] leading-snug">
                  Relocate is a state licensing choice. Cash closes immediately;
                  mortgage is 20% down through First National Mortuary Bank.
                </p>
                <div className="flex flex-col gap-2">
                  <TapButton
                    onTap={() => {
                      setContactedId(detail.id);
                      setFlash(
                        `Broker note: Lychgate desk will hold ${detail.city} for your review. Financing questions → First National.`
                      );
                    }}
                    className="w-full py-2.5 rounded border border-[#8a6b3d] bg-[#faf6ef] text-[12px] font-semibold text-[#5c4020]"
                  >
                    {contactedId === detail.id
                      ? 'Broker contacted'
                      : 'Contact broker'}
                  </TapButton>
                  <div className="flex gap-2">
                    <TapButton
                      onTap={() =>
                        runConfirm(
                          'Buy cash',
                          `Pay $${detail.price.toLocaleString()} and relocate to ${detail.city}, ${detail.stateCode}?`,
                          () => buyProperty(detail.id, 'CASH')
                        )
                      }
                      className="flex-1 py-2.5 rounded bg-[#2a2118] text-[#faf6ef] text-[12px] font-bold"
                    >
                      Buy cash
                    </TapButton>
                    <TapButton
                      onTap={() =>
                        runConfirm(
                          'Mortgage via First National',
                          `20% down ($${Math.ceil(detail.price * 0.2).toLocaleString()}) + mortgage for ${detail.city}?`,
                          () => buyProperty(detail.id, 'MORTGAGE')
                        )
                      }
                      className="flex-1 py-2.5 rounded bg-[#6b4e22] text-[#faf6ef] text-[12px] font-bold"
                    >
                      Mortgage
                    </TapButton>
                  </div>
                  <TapButton
                    onTap={() => setComputerOpenApp('BANK')}
                    className="w-full py-2 text-[11px] text-[#6b4e22] underline"
                  >
                    Open First National Bank
                  </TapButton>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      {confirm && (
        <div className="sheet-safe-inset absolute inset-0 z-30 bg-black/50 flex items-end sm:items-center justify-center">
          <div className="w-full max-w-sm rounded-lg border border-[#c4b49a] bg-[#faf6ef] p-4 space-y-3 shadow-xl">
            <h4
              className="font-bold text-[#2a2118]"
              style={{ fontFamily: '"Libre Baskerville", Georgia, serif' }}
            >
              {confirm.title}
            </h4>
            <p className="text-[13px] text-[#3d3730]">{confirm.body}</p>
            <div className="flex gap-2">
              <TapButton
                onTap={() => setConfirm(null)}
                className="flex-1 py-2 rounded border border-[#c4b49a] bg-white text-[12px] font-semibold"
              >
                Cancel
              </TapButton>
              <TapButton
                onTap={confirm.action}
                className="flex-1 py-2 rounded bg-[#2a2118] text-[#faf6ef] text-[12px] font-bold"
              >
                Confirm
              </TapButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
