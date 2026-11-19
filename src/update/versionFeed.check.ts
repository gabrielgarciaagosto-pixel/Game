/**
 * Locks the update comparison. The app does not import this file.
 */
import { isNewerRelease, parseVersionOffer } from './versionFeed.ts';
import { VERSION_CODE, VERSION_NAME } from '../version.ts';

function check(cond: unknown, message: string): void {
  if (!cond) throw new Error(message);
}

check(
  isNewerRelease(81, '0.9.63-demo', 82, '0.9.64-demo') === true,
  'a higher versionCode is an update'
);
check(
  isNewerRelease(81, '0.9.63-demo', 81, '0.9.99-demo') === false,
  'the same versionCode is not an update, even if the name looks newer'
);
check(
  isNewerRelease(81, '0.9.63-demo', 80, '0.9.62-demo') === false,
  'an older versionCode stays quiet'
);
check(
  isNewerRelease(81, '0.9.63-demo', null, '0.9.64-demo') === true,
  'without a code, a higher name still counts'
);
check(
  isNewerRelease(81, '0.9.63-demo', null, '0.9.63-demo') === false,
  'the same name is not an update'
);
check(
  isNewerRelease(VERSION_CODE, VERSION_NAME, VERSION_CODE, VERSION_NAME) === false,
  'this build does not nag itself'
);

const offer = parseVersionOffer({
  versionName: '0.9.81-demo',
  versionCode: 99,
  apkUrl:
    'https://github.com/gabrielgarciaagosto-pixel/Game/raw/abc/demo/Ossuarian-FirstUrn-v0.9.70-demo.apk',
  notes: 'A short line.',
});
check(offer?.versionCode === 99, 'a newer https feed becomes an offer');
check(offer?.notes === 'A short line.', 'notes come through');
check(
  parseVersionOffer({
    versionName: VERSION_NAME,
    versionCode: VERSION_CODE,
    apkUrl: 'https://example.com/app.apk',
  }) == null,
  'the current release is not an offer'
);
check(
  parseVersionOffer({
    versionName: '9.0.0-demo',
    versionCode: 200,
    apkUrl: 'http://example.com/app.apk',
  }) == null,
  'a plain http link is refused'
);

console.log('version feed policy ok');
