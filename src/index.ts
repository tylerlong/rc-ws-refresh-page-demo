import RingCentral from '@rc-ex/core';
import WebSocketExtension from '@rc-ex/ws';
import waitFor from 'wait-for-async';

const rc = new RingCentral({
  clientId: process.env.RINGCENTRAL_CLIENT_ID!,
  clientSecret: process.env.RINGCENTRAL_CLIENT_SECRET!,
  server: process.env.RINGCENTRAL_SERVER_URL!,
});
(async () => {
  await rc.authorize({
    username: process.env.RINGCENTRAL_USERNAME!,
    extension: process.env.RINGCENTRAL_EXTENSION!,
    password: process.env.RINGCENTRAL_PASSWORD!,
  });
  const webSocketExtension = new WebSocketExtension({});
  await rc.installExtension(webSocketExtension);

  let count = 0;
  await webSocketExtension.subscribe(
    ['/restapi/v1.0/account/~/extension/~/message-store'],
    event => {
      console.log(JSON.stringify(event, null, 2));
      count += 1;
    }
  );

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

  const r = await rc.restapi().subscription().list();
  console.log(JSON.stringify(r, null, 2));

  await rc.revoke();
})();
