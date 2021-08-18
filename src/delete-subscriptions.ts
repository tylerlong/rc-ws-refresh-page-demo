import RingCentral from '@rc-ex/core';

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
  const list = await rc.restapi().subscription().list();
  for (const item of list.records!) {
    await rc.restapi().subscription(item.id).delete();
  }
  await rc.revoke();
})();
