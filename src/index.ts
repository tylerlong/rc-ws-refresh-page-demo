import RingCentral from '@rc-ex/core';
import WebSocketExtension, {Events} from '@rc-ex/ws';
import localforage from 'localforage';
import {TokenInfo} from '@rc-ex/core/lib/definitions';
import {WebSocketOptions, Wsc} from '@rc-ex/ws/lib/types';
import waitFor from 'wait-for-async';

const tokenKey = 'rc-ws-refresh-page-demo-token';
const wscTokenKey = 'rc-ws-refresh-page-demo-wsc-token';

const rc = new RingCentral({
  clientId: process.env.RINGCENTRAL_CLIENT_ID!,
  clientSecret: process.env.RINGCENTRAL_CLIENT_SECRET!,
  server: process.env.RINGCENTRAL_SERVER_URL!,
});

(async () => {
  // restore access token
  const token = (await localforage.getItem(tokenKey)) as TokenInfo;
  if (token === null) {
    const newToken = await rc.authorize({
      username: process.env.RINGCENTRAL_USERNAME!,
      extension: process.env.RINGCENTRAL_EXTENSION!,
      password: process.env.RINGCENTRAL_PASSWORD!,
    });
    await localforage.setItem(tokenKey, newToken);
  } else {
    rc.token = token;
    await rc.refresh();
    await localforage.setItem(tokenKey, rc.token);
  }

  // restore WSG wsc
  const wscToken = (await localforage.getItem(wscTokenKey)) as string;
  const webSocketExtensionOptions: WebSocketOptions = {};
  if (wscToken !== null) {
    console.log('bingo', wscToken);
    webSocketExtensionOptions.wscToken = wscToken;
  }
  const webSocketExtension = new WebSocketExtension(webSocketExtensionOptions);
  webSocketExtension.eventEmitter.on(Events.newWsc, async (wsc: Wsc) => {
    console.log('setItem');
    await localforage.setItem(wscTokenKey, wsc.token);
  });
  await rc.installExtension(webSocketExtension);

  let count = 0;
  if (wscToken === null) {
    await webSocketExtension.subscribe(
      ['/restapi/v1.0/account/~/extension/~/message-store'],
      event => {
        console.log(JSON.stringify(event, null, 2));
        count += 1;
      }
    );
  }
  const r = await rc.restapi().subscription().list();
  console.log(JSON.stringify(r, null, 2));

  await rc
    .restapi()
    .account()
    .extension()
    .companyPager()
    .post({
      from: {extensionNumber: '101'},
      to: [{extensionNumber: '101'}], // send pager to oneself
      text: 'Hello world',
    });

  await waitFor({condition: () => count > 0});
})();
