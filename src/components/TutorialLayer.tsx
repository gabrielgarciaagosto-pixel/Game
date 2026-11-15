import React, { useEffect, useState } from 'react';
import { resolvePlayerName } from '../data/playerName';
import { TUTORIAL_STEPS } from '../tutorial/steps';
import { useGameStore } from '../store/useGameStore';

export const TutorialLayer: React.FC = () => {
  const titleGate = useGameStore((s) => s.titleGate);
  const hasStartedGame = useGameStore((s) => s.hasStartedGame);
  const tutorial = useGameStore((s) => s.tutorial);
  const tutorialStep = useGameStore((s) => s.tutorialStep);
  const playerName = useGameStore((s) => s.playerName);
  const filesPanelOpen = useGameStore((s) => s.filesPanelOpen);
  const archivesPanelOpen = useGameStore((s) => s.archivesPanelOpen);
  const tutorialFileRead = useGameStore((s) => s.tutorialFileRead);
  const activeStation = useGameStore((s) => s.activeStation);
  const computerOpenApp = useGameStore((s) => s.computerOpenApp);
  const tutorialCaseId = useGameStore((s) => s.tutorialCaseId);
  const cases = useGameStore((s) => s.cases);
  const permitSubmissions = useGameStore((s) => s.permitSubmissions);
  const beginTutorial = useGameStore((s) => s.beginTutorial);
  const skipTutorial = useGameStore((s) => s.skipTutorial);
  const skipTutorialStep = useGameStore((s) => s.skipTutorialStep);
  const completeTutorialStep = useGameStore((s) => s.completeTutorialStep);
  const [hintOpen, setHintOpen] = useState(true);

  const name = resolvePlayerName(playerName);
  const tutorialCase = cases.find((c) => c.id === tutorialCaseId);
  const permitFiled =
    tutorialCase == null
      ? permitSubmissions.length > 0
      : tutorialCase.cremationPermitStatus !== 'NONE' ||
        permitSubmissions.some((s) => s.caseId === tutorialCase.id);
  const tagged = tutorialCase == null ? false : tutorialCase.isTagged;
  const step = TUTORIAL_STEPS[tutorialStep];

  useEffect(() => {
    if (tutorial !== 'active') return;
    completeTutorialStep();
  }, [
    tutorial,
    tutorialStep,
    filesPanelOpen,
    archivesPanelOpen,
    tutorialFileRead,
    activeStation,
    computerOpenApp,
    permitFiled,
    tagged,
    completeTutorialStep,
  ]);

  useEffect(() => {
    setHintOpen(true);
  }, [tutorialStep, tutorial]);

  if (titleGate || !hasStartedGame) return null;

  if (tutorial === 'offer') {
    return (
      <div className="fixed inset-0 z-[10010] bg-black/75 flex items-center justify-center p-5">
        <div className="w-full max-w-sm rounded-2xl border border-amber-700/50 bg-[#14110e] p-5 text-[#f3eadc] shadow-2xl">
          <p className="text-[10px] uppercase tracking-[0.22em] text-amber-200/70">
            First case
          </p>
          <h2
            className="mt-1 text-xl"
            style={{ fontFamily: 'Cinzel, Georgia, serif' }}
          >
            A short walkthrough, {name}?
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-[#d9cbb8]">
            One case, from the file to the permit, through the rooms, and into
            Archives. You can skip it.
          </p>
          <div className="mt-5 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => beginTutorial()}
              className="w-full rounded-lg bg-amber-700 py-3 text-sm font-bold text-amber-50"
            >
              Start tutorial
            </button>
            <button
              type="button"
              onClick={() => skipTutorial()}
              className="w-full rounded-lg border border-[#3a3228] py-3 text-sm text-[#d9cbb8]"
            >
              Skip tutorial
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (tutorial !== 'active' || !step) return null;

  return (
    <div
      className="fixed z-[80] flex flex-col items-end gap-2"
      style={{
        top: 'calc(var(--safe-top) + 0.6rem)',
        right: 'var(--safe-right)',
        width: 'min(18rem, calc(100% - 1.5rem))',
      }}
    >
      <button
        type="button"
        aria-label="Tutorial hint"
        onClick={() => setHintOpen((open) => !open)}
        className="w-11 h-11 rounded-full border-2 border-amber-300/80 bg-zinc-950/90 text-amber-200 shadow-lg shadow-black/50 flex items-center justify-center"
      >
        <span className="text-lg leading-none" aria-hidden>
          🔔
        </span>
      </button>
      {hintOpen && (
        <div className="w-full rounded-xl border border-amber-600/50 bg-zinc-950/95 px-3 py-2 text-[12px] leading-snug text-amber-50 shadow-xl">
          {step.hint(name)}
        </div>
      )}
      <div className="flex gap-1.5">
        <button
          type="button"
          onClick={() => skipTutorialStep()}
          className="rounded-full border border-amber-500/40 bg-zinc-950/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-100"
        >
          Skip step
        </button>
        <button
          type="button"
          onClick={() => skipTutorial()}
          className="rounded-full border border-stone-500/50 bg-zinc-950/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-stone-200"
        >
          Skip tutorial
        </button>
      </div>
    </div>
  );
};
