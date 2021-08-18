import RingCentral from '@rc-ex/core';
import WebSocketExtension, {Events} from '@rc-ex/ws';
import localforage from 'localforage';
import {SubscriptionInfo, TokenInfo} from '@rc-ex/core/lib/definitions';
import {WebSocketOptions, Wsc} from '@rc-ex/ws/lib/types';

const tokenKey = 'rc-ws-refresh-page-demo-token';
const wscTokenKey = 'rc-ws-refresh-page-demo-wsc-token';
const subscriptionKey = 'rc-ws-refresh-page-demo-subscription';

const rc = new RingCentral({
  clientId: process.env.RINGCENTRAL_CLIENT_ID!,
  clientSecret: process.env.RINGCENTRAL_CLIENT_SECRET!,
  server: process.env.RINGCENTRAL_SERVER_URL!,
});

const callback = (event: {}) => {
  console.log(JSON.stringify(event, null, 2));
};

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
    webSocketExtensionOptions.wscToken = wscToken;
  }
  const webSocketExtension = new WebSocketExtension(webSocketExtensionOptions);
  webSocketExtension.eventEmitter.on(Events.newWsc, async (wsc: Wsc) => {
    await localforage.setItem(wscTokenKey, wsc.token);
  });
  await rc.installExtension(webSocketExtension);

  // restore subscription
  const subscriptionInfo = (await localforage.getItem(
    subscriptionKey
  )) as SubscriptionInfo;
  const subscription = await webSocketExtension.subscribe(
    ['/restapi/v1.0/account/~/extension/~/message-store'],
    event => callback(event),
    subscriptionInfo // restore old one. new one will be created instead if this parameter is undefined or null
  );
  await localforage.setItem(subscriptionKey, subscription.subscriptionInfo);

  const list = await rc.restapi().subscription().list();
  console.log(JSON.stringify(list, null, 2));

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
})();
