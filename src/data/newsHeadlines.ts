import { houseLineText } from '../news/houseLines';

/**
 * County wire for the hub news feed.
 *
 * EFFECT changes a shop price or the intake pace. Case-spawning celebrity
 * lines are EFFECT too, but they use their own rare slot.
 * MISCELLANEOUS does not change the game: rival parlors, celebrity flavor,
 * and odd county news.
 *
 * VOLUME moves the intake pace for one or two in-game days.
 * RIVAL is flavor about a funeral home the player does not own yet.
 * MARKET moves one shop price for one or two in-game days.
 * CELEBRITY is a fictional name. A few of them also open a case file.
 * ODD is general county color. No prices, no intake, no case.
 */

export type NewsCategory = 'VOLUME' | 'RIVAL' | 'MARKET' | 'CELEBRITY' | 'ODD';

export type NewsGroup = 'EFFECT' | 'MISCELLANEOUS';

export type MarketGood = 'URNS' | 'CASKETS' | 'FUEL' | 'FLOWERS' | 'EMBALMING';

export interface NewsHeadline {
  id: string;
  category: NewsCategory;
  /** EFFECT moves price or volume, or opens a celebrity case. MISCELLANEOUS does not. */
  group: NewsGroup;
  text: string;
  /** 1 or 2 in-game days. A day is one real day. */
  days: number;
  /** Intake multiplier while a volume line is live. */
  flow?: number;
  good?: MarketGood;
  /** Shop multiplier, about 0.88–1.14. */
  price?: number;
  celeb?: string;
  /** When true, a careful service can open as a headline case. */
  spawnsCase?: boolean;
}

/** Restock for one completed prep, before the wire moves it. */
export const EMBALMING_SUPPLY_BASE = 36;

function vol(id: string, text: string, flow: number, days: number): NewsHeadline {
  return { id, category: 'VOLUME', group: 'EFFECT', text, flow, days };
}
function rival(id: string, text: string): NewsHeadline {
  return { id, category: 'RIVAL', group: 'MISCELLANEOUS', text, days: 1 };
}
function market(
  id: string,
  text: string,
  good: MarketGood,
  price: number,
  days: number
): NewsHeadline {
  return { id, category: 'MARKET', group: 'EFFECT', text, good, price, days };
}
function celeb(
  id: string,
  text: string,
  name: string,
  spawnsCase: boolean
): NewsHeadline {
  return {
    id,
    category: 'CELEBRITY',
    group: spawnsCase ? 'EFFECT' : 'MISCELLANEOUS',
    text,
    celeb: name,
    spawnsCase,
    days: 2,
  };
}
function odd(id: string, text: string): NewsHeadline {
  return { id, category: 'ODD', group: 'MISCELLANEOUS', text, days: 1 };
}

export const NEWS_HEADLINES: readonly NewsHeadline[] = [
  vol('vol-01', 'Flu season in the county. More calls for two days.', 1.22, 2),
  vol('vol-02', 'A heat wave is on the valley. The phone is busier.', 1.22, 2),
  vol('vol-03', 'Holiday traffic is stacked up. Expect more arrivals.', 1.25, 1),
  vol('vol-04', 'The new hospital wing opened. Intakes pick up.', 1.28, 2),
  vol('vol-05', 'Black ice on the ridge. A busier night is coming.', 1.22, 1),
  vol('vol-06', 'County fair week. The cooler will not stay empty.', 1.25, 2),
  vol('vol-07', 'A storm warning is up. Calls run ahead of pace.', 1.22, 1),
  vol('vol-08', 'The mill doubled its night shift. So did the messages.', 1.18, 2),
  vol('vol-09', 'Pollen is brutal. The intake bell rings more.', 1.18, 1),
  vol('vol-10', 'A bridge is out. Detours are feeding the parlor.', 1.22, 2),
  vol('vol-11', 'Festival weekend. The wire says the cooler fills faster.', 1.25, 1),
  vol('vol-12', 'The clinic is overrun. Transfers arrive sooner.', 1.22, 2),
  vol('vol-13', 'Fog on the river road. A short, busier stretch.', 1.18, 1),
  vol('vol-14', 'Kitchen fires in the old block. Two busier days.', 1.22, 2),
  vol('vol-15', 'The marathon used the bypass. More calls than Sunday.', 1.18, 1),
  vol('vol-16', 'A cold snap after the thaw. The pace is up for a day.', 1.22, 1),
  vol('vol-17', 'Wedding season downtown. The after-hours line is lively.', 1.18, 2),
  vol('vol-18', 'The nursing hall moved a ward. Expect a fuller week.', 1.25, 2),
  vol('vol-19', 'The power blinked across town. Tomorrow runs hot.', 1.18, 1),
  vol('vol-20', 'A banquet went sideways. Extra calls for a day.', 1.22, 1),
  vol('vol-21', 'A quiet week. Families are well. The cooler can rest.', 0.82, 2),
  vol('vol-22', 'Roads are clear and the week is mild. Fewer arrivals.', 0.84, 1),
  vol('vol-23', 'The county fair moved two towns over. A slower day.', 0.8, 1),
  vol('vol-24', 'The hospital is closed for inspection. Calls ease off.', 0.78, 2),
  vol('vol-25', 'Snow closed the pass. The parlor gets a quieter stretch.', 0.8, 2),
  vol('vol-26', 'A long weekend emptied the streets. Intake slows.', 0.82, 1),
  vol('vol-27', 'Everyone seems to be at the coast. A thin day for calls.', 0.8, 1),
  vol('vol-28', 'The clinic is caught up. The bell rings less today.', 0.84, 1),
  vol('vol-29', 'Mild spring. The wire says this week is slow.', 0.82, 2),
  vol('vol-30', 'Schools are out and town is empty. Fewer new files.', 0.8, 1),
  vol('vol-31', 'A grant sent the ward to the city. Local calls dip.', 0.78, 2),
  vol('vol-32', 'The highway is smooth. A quieter pair of days.', 0.84, 2),
  vol('vol-33', 'Clear skies and no fair. The cooler stays light.', 0.82, 1),
  vol('vol-34', 'Neighbors are looking after neighbors. Intake eases.', 0.84, 1),
  vol('vol-35', 'The night shift was cancelled. Fewer after-dark calls.', 0.8, 1),
  vol('vol-36', 'A gentle week. The phone is almost polite.', 0.84, 2),
  vol('vol-37', 'Clinics report a lull. The next day or two is slow.', 0.82, 2),
  vol('vol-38', 'The river road is open and dull. Calls thin out.', 0.84, 1),
  vol('vol-39', 'Town is at the ball game. The parlor can breathe.', 0.8, 1),
  vol('vol-40', 'A rare healthy week. New files come in slowly.', 0.78, 2),
  rival('riv-01', '{home} put a sandwich board out that just says sooner.'),
  rival('riv-02', '{home} is giving away calendars. The months are wrong.'),
  rival('riv-03', '{home} hired a bagpiper who only knows the one song.'),
  rival('riv-04', '{home} bought a fountain. It leaks into the parlor.'),
  rival('riv-05', '{home} claims the hearse gets great mileage. It is a tractor.'),
  rival('riv-06', '{home} mailed a coupon for one free hymn, verses extra.'),
  rival('riv-07', '{home} parked the hearse in a car-wash prize photo.'),
  rival('riv-08', '{home} renamed the arrangement room The Nook.'),
  rival('riv-09', '{home} offers a loyalty card. The tenth visit is still sad.'),
  rival('riv-10', '{home} bought a neon sign. It buzzes through the eulogy.'),
  rival('riv-11', '{home} advertised two-for-one. The board took it down.'),
  rival('riv-12', '{home} set out a guest book no one can read.'),
  rival('riv-13', '{home} hired a magician for the viewing. He was asked to leave.'),
  rival('riv-14', '{home} says their coffee is complimentary. It is not coffee.'),
  rival('riv-15', '{home} installed a doorbell that plays a dirge.'),
  rival('riv-16', '{home} put a tip jar by the register. Families noticed.'),
  rival('riv-17', '{home} bought matching wind chimes for the hearse.'),
  rival('riv-18', '{home} is raffling a casserole dish. Tickets are a dollar.'),
  rival('riv-19', '{home} painted the porch a cheerful yellow. It clashes.'),
  rival('riv-20', '{home} answers the phone with a joke. It is the same joke.'),
  rival('riv-21', '{home} offers a punch card for pre-need. Nobody punches it.'),
  rival('riv-22', '{home} set up a selfie corner. The board has questions.'),
  rival('riv-23', '{home} bought a fog machine for the chapel. It ate a hymn.'),
  rival('riv-24', '{home} claims to be the friendlier parlor. The sign says so.'),
  rival('riv-25', '{home} left a mannequin in the window in a nice suit.'),
  rival('riv-26', '{home} is sponsoring the little-league team. The bats are black.'),
  rival('riv-27', '{home} sent a fruit basket to the hospital. It was all pears.'),
  rival('riv-28', '{home} installed a drive-through window. It is not in use.'),
  rival('riv-29', '{home} plays smooth jazz in the cooler hallway.'),
  rival('riv-30', '{home} bought a robot greeter. It calls everyone champ.'),
  rival('riv-31', '{home} offers free parking and charges for the hymn sheet.'),
  rival('riv-32', '{home} put their hearse in the holiday parade. Again.'),
  rival('riv-33', '{home} sells commemorative pens that do not write.'),
  rival('riv-34', '{home} hung a \'be back in five\' sign for three days.'),
  rival('riv-35', '{home} named the chapel after a sandwich.'),
  rival('riv-36', '{home} is handing out mints from a bucket labeled mints.'),
  rival('riv-37', '{home} bought a billboard that just says we are open.'),
  rival('riv-38', '{home} trains the staff to whisper. Nobody can hear them.'),
  rival('riv-39', '{home} offers a punch-and-judy show. It was a misprint.'),
  rival('riv-40', '{home} put a goldfish in the arrangement room.'),
  rival('riv-41', '{home} says the carpet is new. It is the old carpet, backwards.'),
  rival('riv-42', '{home} hired a jingle writer. The jingle does not end.'),
  rival('riv-43', '{home} is giving tours on the hour. The tour is the lobby.'),
  rival('riv-44', '{home} bought scented candles labeled unnamed.'),
  rival('riv-45', '{home} parked two hearses nose to nose and called it a fleet.'),
  rival('riv-46', '{home} offers a senior discount on Tuesdays. It is Tuesday.'),
  rival('riv-47', '{home} put a suggestion box out. The box is locked shut.'),
  rival('riv-48', '{home} plays bird calls in the restroom.'),
  rival('riv-49', '{home} sent a mailer that just says think of us.'),
  rival('riv-50', '{home} bought a velvet rope. It guards a closet.'),
  rival('riv-51', '{home} claims a secret recipe for the coffee. There is no coffee.'),
  rival('riv-52', '{home} installed a chandelier that hits tall visitors.'),
  rival('riv-53', '{home} is collecting Yelp reviews from the choir.'),
  rival('riv-54', '{home} put a weather vane on the hearse. It points at the hearse.'),
  rival('riv-55', '{home} offers a free umbrella. The logo washes off.'),
  rival('riv-56', '{home} hired a poet in residence. He writes about lunch.'),
  rival('riv-57', '{home} says the pews are ergonomic. They are pews.'),
  rival('riv-58', '{home} bought a drone. It cannot come inside.'),
  rival('riv-59', '{home} set the thermostat to a confident sixty-one.'),
  rival('riv-60', '{home} is raffling the good parking space.'),
  rival('riv-61', '{home} put a \'now serving\' sign up. The number is zero.'),
  rival('riv-62', '{home} mailed magnets. They do not stick to anything.'),
  rival('riv-63', '{home} bought a second sign because the first one was shy.'),
  rival('riv-64', '{home} offers a children\'s corner with one very old puzzle.'),
  rival('riv-65', '{home} plays the radio one station off, on purpose.'),
  rival('riv-66', '{home} says they invented the folding chair. They did not.'),
  rival('riv-67', '{home} hung portraits of the founders. The frames are empty.'),
  rival('riv-68', '{home} is closed for a staff picnic. The sign is undated.'),
  rival('riv-69', '{home} bought a bell. Someone rings it for no reason.'),
  rival('riv-70', '{home} offers a newsletter. The last issue wished you well.'),
  market('mkt-01', 'The quarry raised marble. Urns cost more for now.', 'URNS', 1.08, 2),
  market('mkt-02', 'A kiln backlog. Vessel prices are up for a day.', 'URNS', 1.1, 1),
  market('mkt-03', 'Bronze got dear. The urn shelf follows it.', 'URNS', 1.12, 2),
  market('mkt-04', 'Import glass is late. Urn tags tick upward.', 'URNS', 1.1, 1),
  market('mkt-05', 'Polished stone is scarce. Urns cost a little more.', 'URNS', 1.14, 2),
  market('mkt-06', 'A marble surplus. Urns are cheaper for a day.', 'URNS', 0.92, 2),
  market('mkt-07', 'The kiln caught up. Vessel prices ease off.', 'URNS', 0.9, 1),
  market('mkt-08', 'A bronze glut. The urn shelf is kinder today.', 'URNS', 0.88, 2),
  market('mkt-09', 'Glass came in early. Urn prices dip.', 'URNS', 0.9, 1),
  market('mkt-10', 'Quarry seconds are plentiful. Urns cost less.', 'URNS', 0.92, 2),
  market('mkt-11', 'Hardwood is tight. Caskets cost more this week.', 'CASKETS', 1.08, 2),
  market('mkt-12', 'The cloth mill raised satin. Casket tags rise.', 'CASKETS', 1.1, 1),
  market('mkt-13', 'Steel sheet went up. Coffins follow for a day.', 'CASKETS', 1.12, 2),
  market('mkt-14', 'Brass hardware is scarce. Caskets tick upward.', 'CASKETS', 1.1, 1),
  market('mkt-15', 'Oak is on allocation. The casket floor is dearer.', 'CASKETS', 1.14, 2),
  market('mkt-16', 'A pine surplus. Caskets are cheaper for a day.', 'CASKETS', 0.92, 2),
  market('mkt-17', 'Satin came off allocation. Casket prices ease.', 'CASKETS', 0.9, 1),
  market('mkt-18', 'Steel is plentiful. Coffin tags dip.', 'CASKETS', 0.88, 2),
  market('mkt-19', 'Hardware arrived early. Caskets cost a little less.', 'CASKETS', 0.9, 1),
  market('mkt-20', 'The mill overcut oak. The casket floor is kinder.', 'CASKETS', 0.92, 2),
  market('mkt-21', 'The gas contract jumped. A firing costs more.', 'FUEL', 1.08, 2),
  market('mkt-22', 'Cold weather. Retort fuel is up for two days.', 'FUEL', 1.1, 1),
  market('mkt-23', 'The supplier added a surcharge. Firings cost more.', 'FUEL', 1.12, 2),
  market('mkt-24', 'A pipeline delay. Fuel per firing ticks up.', 'FUEL', 1.1, 1),
  market('mkt-25', 'Peak rates are in. The meter runs a little hot.', 'FUEL', 1.14, 2),
  market('mkt-26', 'A mild week. Fuel per firing is cheaper.', 'FUEL', 0.92, 2),
  market('mkt-27', 'The surcharge lapsed. Firings cost less today.', 'FUEL', 0.9, 1),
  market('mkt-28', 'A spot cargo landed. The meter eases off.', 'FUEL', 0.88, 2),
  market('mkt-29', 'Off-peak rates. A firing is a little cheaper.', 'FUEL', 0.9, 1),
  market('mkt-30', 'The contract renewed low. Fuel dips for a day.', 'FUEL', 0.92, 2),
  market('mkt-31', 'A frost hit the greenhouses. Sprays cost more.', 'FLOWERS', 1.08, 2),
  market('mkt-32', 'Lilies are short. Flower tags are up for a day.', 'FLOWERS', 1.1, 1),
  market('mkt-33', 'Wedding orders cleared the roses. Sprays rise.', 'FLOWERS', 1.12, 2),
  market('mkt-34', 'The wholesaler raised stems. Flowers cost more.', 'FLOWERS', 1.1, 1),
  market('mkt-35', 'Wreath greens are scarce. The merch shelf ticks up.', 'FLOWERS', 1.14, 2),
  market('mkt-36', 'A greenhouse glut. Flowers are cheaper today.', 'FLOWERS', 0.92, 2),
  market('mkt-37', 'Lilies came in heavy. Sprays cost less.', 'FLOWERS', 0.9, 1),
  market('mkt-38', 'Roses are plentiful. The flower shelf eases.', 'FLOWERS', 0.88, 2),
  market('mkt-39', 'Stems were overshipped. Flower prices dip.', 'FLOWERS', 0.9, 1),
  market('mkt-40', 'Wreath greens are cheap. Merch flowers cost less.', 'FLOWERS', 0.92, 2),
  market('mkt-41', 'Arterial fluid is short. A prep costs more.', 'EMBALMING', 1.08, 2),
  market('mkt-42', 'The chemical house raised index. Supplies tick up.', 'EMBALMING', 1.1, 1),
  market('mkt-43', 'Softener is on allocation. Prep restock costs more.', 'EMBALMING', 1.12, 2),
  market('mkt-44', 'A drum fee landed. Embalming supplies are dearer.', 'EMBALMING', 1.1, 1),
  market('mkt-45', 'Formaldehyde freight jumped. A prep costs more.', 'EMBALMING', 1.14, 2),
  market('mkt-46', 'Fluid is plentiful. A prep restock costs less.', 'EMBALMING', 0.92, 2),
  market('mkt-47', 'The index dropped. Embalming supplies ease off.', 'EMBALMING', 0.9, 1),
  market('mkt-48', 'Softener came off allocation. Prep cost dips.', 'EMBALMING', 0.88, 2),
  market('mkt-49', 'A drum refund. Supplies are cheaper for a day.', 'EMBALMING', 0.9, 1),
  market('mkt-50', 'Freight eased. The prep restock is a little less.', 'EMBALMING', 0.92, 2),
  celeb('cel-01', 'Skip Hearthstone, of the county-fair jingle, has died.', 'Skip Hearthstone', true),
  celeb('cel-02', 'Dame Nettle of the radio play has died. Another house has the call.', 'Dame Nettle', false),
  celeb('cel-03', 'Bix Carmody, who judged the pie tent, has died.', 'Bix Carmody', true),
  celeb('cel-04', 'Orry Quilt the parade marshal has died. The body went across town.', 'Orry Quilt', false),
  celeb('cel-05', 'Nana Static, voice of the late-night swap shop, has died.', 'Nana Static', true),
  celeb('cel-06', 'Lord Bramble, who was not a lord, has died elsewhere.', 'Lord Bramble', false),
  celeb('cel-07', 'Madame Lumen the lantern lecturer has died.', 'Madame Lumen', true),
  celeb('cel-08', 'Pip Widders of the noon quiz has died. Not our call.', 'Pip Widders', false),
  celeb('cel-09', 'Auntie Moss, who wrote the church cookbook, has died.', 'Auntie Moss', true),
  celeb('cel-10', 'Rex Butterknife the dinner-theater knight has died elsewhere.', 'Rex Butterknife', false),
  celeb('cel-11', 'Duchess Plover of the bird hour has died.', 'Duchess Plover', true),
  celeb('cel-12', 'Cal Honeysuckle the weatherman has died. Another parlor took it.', 'Cal Honeysuckle', false),
  celeb('cel-13', 'Junie Vale, singer of the grocery jingle, has died.', 'Junie Vale', true),
  celeb('cel-14', 'Morty Glass the magician has died. The dove went to a rival.', 'Morty Glass', false),
  celeb('cel-15', 'Sister Pudding of the soup kitchen hour has died.', 'Sister Pudding', true),
  celeb('cel-16', 'Hank Lumen, who sold neon to chapels, has died elsewhere.', 'Hank Lumen', false),
  celeb('cel-17', 'Pearl Axle, queen of the demolition derby, has died.', 'Pearl Axle', true),
  celeb('cel-18', 'Otto Crumb the banjo priest has died. Not our file.', 'Otto Crumb', false),
  celeb('cel-19', 'Lila Pond, host of Dawn Dish, has died.', 'Lila Pond', true),
  celeb('cel-20', 'Gus Ribbon the parade clown has died across the river.', 'Gus Ribbon', false),
  celeb('cel-21', 'Madam Keyhole the advice column has died.', 'Madam Keyhole', true),
  celeb('cel-22', 'Ned Farrow, who rang the courthouse bell, has died elsewhere.', 'Ned Farrow', false),
  celeb('cel-23', 'Tansy Bloom of the garden report has died elsewhere.', 'Tansy Bloom', false),
  celeb('cel-24', 'Walt Kettle the auctioneer has died. A rival already signed.', 'Walt Kettle', false),
  celeb('cel-25', 'Ivy Lantern, who lit the footbridge, has died.', 'Ivy Lantern', true),
  celeb('cel-26', 'Bram Hush the library ghost tour has died. Not our intake.', 'Bram Hush', false),
  celeb('cel-27', 'Cora Silt, poet of the drainage canal, has died elsewhere.', 'Cora Silt', false),
  celeb('cel-28', 'Flip Mercer the used-boat king has died elsewhere.', 'Flip Mercer', false),
  celeb('cel-29', 'Nim Pepper of the hot-sauce hour has died elsewhere.', 'Nim Pepper', false),
  celeb('cel-30', 'Dale Vesper, who played organ at the rink, has died across town.', 'Dale Vesper', false),
  celeb('cel-31', 'Hettie Moon the quilt-show judge has died elsewhere.', 'Hettie Moon', false),
  celeb('cel-32', 'Sol Bracket, inventor of the quiet doorbell, has died elsewhere.', 'Sol Bracket', false),
  celeb('cel-33', 'Rue Candle of the midnight recipe has died elsewhere.', 'Rue Candle', false),
  celeb('cel-34', 'Pax Yarrow the ferry announcer has died. Another house filed.', 'Pax Yarrow', false),
  celeb('cel-35', 'Moth Keller, who painted every mural, has died.', 'Moth Keller', false),
  celeb('cel-36', 'Bing Harlow the polka editor has died. Not our parlor.', 'Bing Harlow', false),
  celeb('cel-37', 'Tess Bracken of the bird-count has died.', 'Tess Bracken', false),
  celeb('cel-38', 'Ollie Grange, mascot of the feed store, has died elsewhere.', 'Ollie Grange', false),
  celeb('cel-39', 'Willa Socket the radio engineer has died.', 'Willa Socket', false),
  celeb('cel-40', 'Archie Pebble, who named the town creeks, has died across town.', 'Archie Pebble', false),
  odd('odd-01', 'A raccoon filed a complaint at the courthouse and lost.'),
  odd('odd-02', 'The river ran backwards for an hour. The fish looked surprised.'),
  odd('odd-03', 'Someone left a tuba on the town hall steps.'),
  odd('odd-04', 'The library ghost is only checking out cookbooks.'),
  odd('odd-05', 'A parade of lawn chairs went down Main before breakfast.'),
  odd('odd-06', 'The grain-elevator clock is an hour early and proud of it.'),
  odd('odd-07', 'Pigeons have unionized the bandstand.'),
  odd('odd-08', 'A fog bank took questions after the meeting.'),
  odd('odd-09', 'The diner served a soup that remembered your name.'),
  odd('odd-10', 'The Oak Street lights blinked good-night in Morse.'),
  odd('odd-11', 'A wedding cake escaped a van and rolled three blocks.'),
  odd('odd-12', 'The mayor’s dog has a press secretary.'),
  odd('odd-13', 'Thunder rehearsed over the ridge, then cancelled.'),
  odd('odd-14', 'A hot-air balloon landed in the cemetery and apologized.'),
  odd('odd-15', 'The bingo hall smelled like cinnamon and secrets.'),
  odd('odd-16', 'Someone mowed a short poem into the high-school lawn.'),
  odd('odd-17', 'The ferry captain is singing only in questions today.'),
  odd('odd-18', 'A crate of hats arrived with no return address.'),
  odd('odd-19', 'The moon looks closer. The astronomers are staying polite.'),
  odd('odd-20', 'Children say the creek is telling knock-knock jokes.'),
  odd('odd-21', 'A brass band practiced in the parking lot at dawn.'),
  odd('odd-22', 'The weather vane has chosen a new favorite direction.'),
  odd('odd-23', 'The ice-cream truck is playing only lullabies.'),
  odd('odd-24', 'The post office lost a letter and found a better one.'),
  odd('odd-25', 'Geese are holding the crosswalk longer than usual.'),
  odd('odd-26', 'A piano rode the freight elevator alone.'),
  odd('odd-27', 'The county fair’s largest pumpkin has a fan club.'),
  odd('odd-28', 'The bakery’s night shift sent the town fresh rolls.'),
  odd('odd-29', 'A scarecrow downtown was dressed for the opera.'),
  odd('odd-30', 'The radio played static that sounded like applause.'),
  odd('odd-31', 'Someone donated a fountain that only runs on Tuesdays.'),
  odd('odd-32', 'The bridge inspector waved at every car twice.'),
  odd('odd-33', 'A lost collection of balloons is gathering over the mill.'),
  odd('odd-34', 'The hardware store is giving away single screws.'),
  odd('odd-35', 'Choir practice carried all the way to the water tower.'),
  odd('odd-36', 'A quiet comet is scheduled, weather permitting.'),
  odd('odd-37', 'The town cat has taken the night clerk’s chair.'),
  odd('odd-38', 'Lemonade stands are outnumbering the parking meters.'),
  odd('odd-39', 'A train whistled a tune nobody taught it.'),
  odd('odd-40', 'The gazebo lights came on by themselves and stayed kind.'),
  odd('odd-41', 'Farmers say the corn is listening, so they lowered their voices.'),
  odd('odd-42', 'A suitcase of sheet music was returned to the depot.'),
  odd('odd-43', 'The barber pole spun the wrong way and nobody minded.'),
  odd('odd-44', 'Kids found a round stone and named it Mayor.'),
  odd('odd-45', 'The evening paper printed an extra page of good luck.'),
  odd('odd-46', 'A rowboat drifted past the docks with its lantern still lit.'),
  odd('odd-47', 'The school bell rang once, softly, after hours.'),
  odd('odd-48', 'Someone chalked a map of the clouds on the sidewalk.'),
];

const BY_ID = new Map(NEWS_HEADLINES.map((h) => [h.id, h]));

export function headlineById(id: string): NewsHeadline | undefined {
  const posted = houseLineText(id);
  if (posted) {
    return {
      id,
      category: 'ODD',
      group: 'MISCELLANEOUS',
      text: posted,
      days: 1,
    };
  }
  return BY_ID.get(id);
}

export function headlineCounts(): Record<NewsCategory, number> {
  const counts: Record<NewsCategory, number> = {
    VOLUME: 0,
    RIVAL: 0,
    MARKET: 0,
    CELEBRITY: 0,
    ODD: 0,
  };
  for (const h of NEWS_HEADLINES) counts[h.category] += 1;
  return counts;
}

export function headlineGroupCounts(): Record<NewsGroup, number> {
  const counts: Record<NewsGroup, number> = { EFFECT: 0, MISCELLANEOUS: 0 };
  for (const h of NEWS_HEADLINES) counts[h.group] += 1;
  return counts;
}

export function renderHeadline(text: string, homeLabel?: string): string {
  if (!text.includes('{home}')) return text;
  return text.replaceAll('{home}', homeLabel ?? 'A rival parlor');
}

