/** One place for the spirit's name. The dialogue header reads this. */
export const TUTORIAL_SPIRIT_NAME = 'Calla';

export const TUTORIAL_SPIRIT_TITLE = 'Tutorial Spirit';

export function tutorialSpiritHeading(): string {
  return `${TUTORIAL_SPIRIT_NAME}, the ${TUTORIAL_SPIRIT_TITLE}`;
}
