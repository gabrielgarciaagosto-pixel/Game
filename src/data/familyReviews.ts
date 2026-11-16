import type { HouseTierLetter } from './rankProgression';
import { ratingTier } from './caseRating';

export interface ReviewContext {
  name: string;
  /** Full clause, already worded for this service. */
  roses: string;
  music: string;
  vessel: string;
  stock: string;
}

export interface FamilyReview {
  id: string;
  tier: HouseTierLetter;
  text: string;
  signer: string;
  relation: string;
}

const SIGNERS: ReadonlyArray<readonly [string, string]> = [
  ['Margaret Hale', 'sister'],
  ['James Okonkwo', 'son'],
  ['Priya Shah', 'daughter'],
  ['Robert Ellison', 'brother'],
  ['Helen Cho', 'aunt'],
  ['Marcus Webb', 'uncle'],
  ['Ana Ruiz', 'niece'],
  ['David Berg', 'nephew'],
  ['Claire Fontaine', 'cousin'],
  ['Samuel Adeyemi', 'son-in-law'],
  ['Nora Petrov', 'granddaughter'],
  ['Thomas Wright', 'grandson'],
  ['Imani Brooks', 'sister-in-law'],
  ['Patrick Keane', 'brother-in-law'],
  ['Lydia Chen', 'cousin'],
];

const BODIES: Record<HouseTierLetter, readonly string[]> = {
  'S+': [
    'We walked out holding each other. {name} was looked after with a gentleness we will keep. {roses}. {music}. {vessel} felt like the right choice, and {stock}.',
    'I do not have words big enough. Everything we hoped for {name} was there. {roses}. {music}. Thank you for {vessel}.',
    'Please tell the house we noticed. {name} would have loved this hour. {roses}. {music}. {vessel} was exactly the one we would have picked.',
    'My voice kept failing me in the best way. You gave {name} a farewell that felt whole. {roses}. {music}. {stock}.',
    'We came in braced and left grateful. The care around {name} was extraordinary. {roses}. {music}. {vessel} belonged in that room.',
    'I will be telling this story for years. {name} was honored, not hurried. {roses}. {music}. Choosing {vessel} from what you had was a kindness.',
    'Nothing felt missing. {name} was surrounded by what we asked for and more. {roses}. {music}. {stock}.',
    'From the first look at {name} to the last quiet minute, it was beautiful. {roses}. {music}. {vessel} made the family nod.',
    'You treated {name} as someone beloved, which is all we wanted. {roses}. {music}. We are still talking about how right {vessel} felt.',
    'I squeezed my cousin’s hand the whole time. {name} was in such careful hands. {roses}. {music}. {stock}.',
    'This is the service we will measure others by. {name} was given every wish we named. {roses}. {music}. {vessel} was a perfect fit.',
    'Thank you, truly. {name} looked at peace, and the room felt like ours. {roses}. {music}. {stock}.',
    'We asked for a great deal and you met it without fuss. {name} was cherished. {roses}. {music}. {vessel} was the choice we hoped you still had.',
    'I cried, then I laughed, then I cried again. {name} would have been proud. {roses}. {music}. {stock}.',
    'Carry our thanks to everyone who touched this day. {name} was sent off exactly as we pictured. {roses}. {music}. {vessel} was wonderful.',
  ],
  S: [
    'What a fine farewell for {name}. {roses}. {music}. {vessel} suited the hour, and {stock}.',
    'We felt looked after from the door to the last hymn. {name} was in good hands. {roses}. {music}.',
    'Thank you for the care you gave {name}. {roses}. {music}. {vessel} was a choice we were glad to see.',
    'The room felt warm and intentional. {name} would have approved. {roses}. {music}. {stock}.',
    'We left lighter than we arrived. You honored {name}. {roses}. {music}. {vessel} was right.',
    'A beautiful service. {name} was treated with real respect. {roses}. {music}. {stock}.',
    'Please know the family noticed the details. {name} was well served. {roses}. {music}. {vessel} felt personal.',
    'I kept thinking, they listened. {name}’s hour was dignified and kind. {roses}. {music}.',
    'We are grateful. {name} was given a farewell with heart. {roses}. {music}. {stock}.',
    'Neighbors asked who arranged it. I gave them your name, for {name}. {roses}. {music}. {vessel} drew compliments.',
    'It felt like a family day, not a transaction. Thank you for {name}. {roses}. {music}.',
    'You made a hard morning gentler. {name} was surrounded by care. {roses}. {music}. {stock}.',
    'We will remember the quiet as much as the flowers. {name} was honored. {roses}. {music}. {vessel} was a good choice.',
    'Handshakes at the door were sincere. {name} would have liked this house. {roses}. {music}.',
    'Thank you for getting the important things right for {name}. {roses}. {music}. {stock}.',
  ],
  A: [
    'A warm service for {name}. {roses}. {music}. We were glad {vessel} was among what you had.',
    'Thank you. Most of what we hoped for {name} was there. {roses}. {music}. {stock}.',
    'We felt welcomed, and {name} was treated kindly. {roses}. {music}. A small thing or two was off, and that is all right.',
    'It was a good hour. {name} looked cared for. {roses}. {music}. {vessel} was a solid choice.',
    'The family is thankful. {name}’s service had real warmth. {roses}. {music}. {stock}.',
    'You did right by {name}. {roses}. {music}. We noticed {vessel} and appreciated having a choice at all.',
    'A respectful farewell. {name} was not rushed. {roses}. {music}. One wish sat a little aside, and we can live with that.',
    'Please pass on our thanks. {name} was in capable hands. {roses}. {music}. {stock}.',
    'We left grateful, with one small note. {name} deserved the care you gave. {roses}. {music}.',
    'The room felt like a proper goodbye. {name} would have been content. {roses}. {music}. {vessel} was fine.',
    'Kind people, a kind hour. Thank you for {name}. {roses}. {music}. {stock}.',
    'We talked about it on the drive home and the word was “good.” {name} was honored. {roses}. {music}.',
    'You listened to most of what we asked for {name}. {roses}. {music}. {vessel} did the job with dignity.',
    'A steady, warm service. {name} was looked after. {roses}. {music}. {stock}.',
    'Thank you for the effort around {name}. {roses}. {music}. The misses were small beside the care.',
  ],
  B: [
    'Thank you for looking after {name}. {roses}. {music}. It was a decent farewell, with a few wishes still open. {stock}.',
    'We appreciated the hour for {name}. {roses}. {music}. {vessel} was acceptable, though the day was not quite complete.',
    'A sincere service. {name} was treated with respect. {roses}. {music}. We noticed what was missing and what was there.',
    'The family is all right with how it went for {name}. {roses}. {music}. {stock}.',
    'You were kind, and that mattered for {name}. {roses}. {music}. A couple of requests did not land.',
    'We would call it a fair goodbye. {name} was not neglected. {roses}. {music}. {vessel} was what you had, and we understand.',
    'Thank you for the work you did for {name}. {roses}. {music}. {stock}. Next time a fuller shelf would help.',
    'It felt honest, if a little thin in places. {name} was still honored. {roses}. {music}.',
    'We are grateful for the care, and we did notice the gaps. {name} deserved those notes. {roses}. {music}. {vessel}.',
    'A plain-spoken thank you for {name}. {roses}. {music}. {stock}.',
    'The staff were gentle with {name}. {roses}. {music}. The shape of the day was almost what we asked.',
    'We left quietly. {name} was in respectable hands. {roses}. {music}. {vessel} was a modest choice.',
    'Not every wish was met, and we are not angry. {name} was looked after. {roses}. {music}. {stock}.',
    'Thank you for showing up for {name}. {roses}. {music}. A fuller selection would have eased the choosing.',
    'It was a workable farewell. {name} was treated as a person. {roses}. {music}. {stock}.',
  ],
  C: [
    'We thank you for receiving {name}. {roses}. {music}. Several things we asked for were not there. {stock}.',
    'The hour happened, and we are glad {name} was not alone in it. {roses}. {music}. {vessel} was a limited choice.',
    'Please hear this kindly. {name}’s service was only partly what we hoped. {roses}. {music}. {stock}.',
    'We know funerals are hard work. For {name}, a few important pieces were missing. {roses}. {music}.',
    'Thank you for trying. {name} was treated politely. {roses}. {music}. {stock}. We had hoped for more of what we named.',
    'It was an ordinary goodbye, and {name} needed a little more than ordinary. {roses}. {music}. {vessel} felt like a compromise.',
    'We are not upset with anyone’s manners. The plan for {name} was only half met. {roses}. {music}. {stock}.',
    'A quiet thank you, with regrets attached. {name} deserved the roses and the music we asked about. {roses}. {music}.',
    'We got through it. {name} was cared for at a basic level. {roses}. {music}. {stock}.',
    'The family will remember that you took {name} in. {roses}. {music}. The selection and the wishes were both thin.',
    'It felt unfinished for {name}. {roses}. {music}. {vessel} was the best of a short list.',
    'We appreciate the effort and we have to name the misses. {name}’s hour was only fair. {roses}. {music}. {stock}.',
    'No one was unkind. That matters. Still, {name}’s requests were only partly kept. {roses}. {music}.',
    'Thank you for the time you gave {name}. {roses}. {music}. {stock}. A wider stock would have changed the day.',
    'We left with mixed feelings. {name} was safe in your care, and several wishes were not. {roses}. {music}.',
  ],
  D: [
    'We are sorry to say {name}’s farewell fell short of what we asked. {roses}. {music}. {stock}. We are still grateful you tried.',
    'Thank you for being civil. For {name}, too many of the details were wrong or absent. {roses}. {music}. {vessel} was a narrow choice.',
    'The family is disappointed, and we want to stay polite about it. {name} needed more. {roses}. {music}. {stock}.',
    'We will not pretend it was the hour we planned for {name}. {roses}. {music}. Please take that as a request, not an attack.',
    'You received {name}, and that part we honor. The rest was thin. {roses}. {music}. {stock}.',
    'It was a difficult visit. {name}’s wishes were mostly unmet. {roses}. {music}. {vessel} did not feel like a real choice.',
    'We left quieter than we expected, and not in a peaceful way. {name} deserved closer attention. {roses}. {music}. {stock}.',
    'Please stock more, and please hear the requests. {name}’s service missed too much. {roses}. {music}.',
    'A restrained note: we are unhappy with how {name} was sent off. {roses}. {music}. {stock}. The staff were not rude.',
    'We had hoped the shelf and the chapel would both be ready for {name}. {roses}. {music}. {vessel} was what remained.',
    'This is hard to write. {name} was treated adequately, and the day was not what we asked. {roses}. {music}. {stock}.',
    'We can forgive a miss. There were several, for {name}. {roses}. {music}. A fuller inventory would have helped.',
    'Thank you for the paperwork and the kindness at the door. The service itself, for {name}, was lacking. {roses}. {music}. {stock}.',
    'We are disappointed in the choices on hand and in what reached the room. {name} needed both. {roses}. {music}.',
    'Take this as a gentle complaint. {name}’s farewell did not match the family’s asks. {roses}. {music}. {stock}.',
  ],
  E: [
    'We are writing because {name}’s hour was far from what we requested. {roses}. {music}. {stock}. We are not here to be cruel about it.',
    'The family is let down. {name} was received, and little else we asked for arrived. {roses}. {music}. {vessel} felt like an afterthought.',
    'Please do better for the next family than you could for {name}. {roses}. {music}. {stock}. We say that sadly, not sharply.',
    'We sat through it and wished we were somewhere closer to the plan. {name} deserved that plan. {roses}. {music}.',
    'A polite and unhappy note. {name}’s service missed the mark. {roses}. {music}. {stock}.',
    'There was not enough to choose from, and not enough of our wishes in the room, for {name}. {roses}. {music}. {vessel} was nearly the only option.',
    'We thank you for not turning us away. Beyond that, {name}’s farewell was poor. {roses}. {music}. {stock}.',
    'It hurt to see how little of {name}’s requests survived the day. {roses}. {music}. We hope the house can hear that.',
    'We left disappointed and still willing to be fair. {name} was not given the goodbye we described. {roses}. {music}. {stock}.',
    'The selection was meager and the chapel did not follow what we said about {name}. {roses}. {music}. {vessel} could not carry the hour alone.',
    'This is the disappointed version of a thank-you. You took {name} in. {roses}. {music}. {stock}.',
    'We had to lower our expectations in the room. {name} should not have required that. {roses}. {music}.',
    'Please read this as regret, not spite. {name}’s service was well below what a family asks. {roses}. {music}. {stock}.',
    'Very little matched. {name} was handled, and the wishes were not. {roses}. {music}. {vessel} was a slim offering.',
    'We will remember the gaps more than the gestures. {name} needed the opposite. {roses}. {music}. {stock}.',
  ],
  F: [
    'We are sorry to send a note like this. {name}’s farewell did not resemble what we asked. {roses}. {music}. {stock}. The people were not unkind, and the result still failed us.',
    'Please take this without anger in it. We are deeply disappointed for {name}. {roses}. {music}. {vessel} was not a real selection.',
    'Almost none of it was what we requested for {name}. {roses}. {music}. {stock}. We still thank you for opening the door.',
    'The family left unhappy. {name} deserved a farewell, and this was only a procedure. {roses}. {music}.',
    'We do not want to be harsh. We do have to say {name} was let down. {roses}. {music}. {stock}.',
    'There was too little on hand and too little of our plan in the room. {name} needed both. {roses}. {music}. {vessel} made that plain.',
    'A disappointed family, writing carefully. {name}’s hour was not acceptable to us. {roses}. {music}. {stock}.',
    'We asked for specific things and did not receive them. {name} was the one who bore that. {roses}. {music}.',
    'This is as plain as we can be while staying polite. {name}’s service failed our requests. {roses}. {music}. {stock}.',
    'We had hoped the stock and the wishes would both be honored for {name}. Neither really was. {roses}. {music}. {vessel} was a last resort.',
    'Thank you for the attempt. It was not enough for {name}. {roses}. {music}. {stock}.',
    'We are grieving, and we are also disappointed in the house. {name} should have had more. {roses}. {music}.',
    'Please stock the shelves and keep the requests. {name}’s day had neither in any real way. {roses}. {music}. {stock}.',
    'We will not dress this up. {name} was not given the goodbye we described. {roses}. {music}. {vessel} could not save it, and we are not blaming a single object.',
    'With regret, the family cannot call this a success for {name}. {roses}. {music}. {stock}. We hope the next house call goes differently.',
  ],
};

function pack(tier: HouseTierLetter): FamilyReview[] {
  const bodies = BODIES[tier];
  if (bodies.length !== 15) {
    throw new Error(`${tier} reviews: expected 15, found ${bodies.length}`);
  }
  const seen = new Set<string>();
  return bodies.map((body, index) => {
    if (seen.has(body)) throw new Error(`Duplicate ${tier} review ${index}`);
    seen.add(body);
    const [signer, relation] = SIGNERS[index]!;
    return {
      id: `${tier}-${index}`,
      tier,
      text: body,
      signer,
      relation,
    };
  });
}

const TIERS: HouseTierLetter[] = ['S+', 'S', 'A', 'B', 'C', 'D', 'E', 'F'];

export const FAMILY_REVIEWS: readonly FamilyReview[] = TIERS.flatMap(pack);

const byTier = new Map<HouseTierLetter, FamilyReview[]>();
for (const tier of TIERS) {
  byTier.set(
    tier,
    FAMILY_REVIEWS.filter((review) => review.tier === tier)
  );
}

let lastReviewId: string | null = null;

export function fillFamilyReview(body: string, ctx: ReviewContext): string {
  const stock =
    ctx.stock.charAt(0).toUpperCase() + ctx.stock.slice(1);
  const stockLower = ctx.stock.charAt(0).toLowerCase() + ctx.stock.slice(1);
  return body
    .replaceAll('{name}', ctx.name)
    .replaceAll('{roses}', ctx.roses)
    .replaceAll('{music}', ctx.music)
    .replaceAll('{vessel}', ctx.vessel)
    .replaceAll('and {stock}', `and ${stockLower}`)
    .replaceAll('{stock}', stock);
}

/** One review for this tier. The same id is not drawn twice in a row. */
export function pickFamilyReview(
  score: number,
  ctx: ReviewContext
): { tier: HouseTierLetter; text: string; signer: string; relation: string; id: string } {
  const tier = ratingTier(score);
  const pool = byTier.get(tier) ?? byTier.get('F')!;
  const fresh = pool.filter((review) => review.id !== lastReviewId);
  const choices = fresh.length > 0 ? fresh : pool;
  const pick = choices[Math.floor(Math.random() * choices.length)]!;
  lastReviewId = pick.id;
  return {
    tier,
    id: pick.id,
    text: fillFamilyReview(pick.text, ctx),
    signer: pick.signer,
    relation: pick.relation,
  };
}
