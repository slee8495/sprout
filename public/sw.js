self.addEventListener("push", (event) => {
  if (!event.data) return;
  const data = event.data.json();

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/icon-192",
      badge: "/icon-192",
      data: { url: data.url || "/feed" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/feed";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(async (clientList) => {
      const client = clientList[0];
      if (client && "focus" in client) {
        if ("navigate" in client) {
          try {
            await client.navigate(url);
          } catch {
            // Fall through to focusing the client as-is if navigate isn't supported.
          }
        }
        return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    }),
  );
});
