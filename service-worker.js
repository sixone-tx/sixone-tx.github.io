/*
Copyright 2015, 2019, 2020, 2021 Google LLC. All Rights Reserved.
 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at
 http://www.apache.org/licenses/LICENSE-2.0
 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
*/

// Incrementing OFFLINE_VERSION will kick off the install event and force
// previously cached resources to be updated from the network.
// This variable is intentionally declared and unused.
// Add a comment for your linter if you want:
// eslint-disable-next-line no-unused-vars

// Service Worker
// https://developers.google.com/web/fundamentals/primers/service-workers?hl=zh-cn

const OFFLINE_VERSION = 1;
const CACHE_NAME = "offline-1";
// Customize this with a different URL if needed.
const OFFLINE_URL = "index.html";
const cacheList = ["/", "index.html", "logo.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      // Setting {cache: 'reload'} in the new request will ensure that the
      // response isn't fulfilled from the HTTP cache; i.e., it will be from
      // the network.
      // await cache.add(new Request(OFFLINE_URL, { cache: "reload" }));
      await cache.addAll(cacheList);
    })()
  );
  // Force the waiting service worker to become the active service worker.
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // Enable navigation preload if it's supported.
      // See Speed up Service Worker with Navigation Preloads https://developers.google.com/web/updates/2017/02/navigation-preload
      // 一文看懂Chrome浏览器运行机制https://zhuanlan.zhihu.com/p/102149546
      if ("navigationPreload" in self.registration) {
        // 当您导航到使用service worker来处理获取事件的站点时，浏览器会请求service worker响应。
        // 这包括启动service worker(如果它还没有运行)，并分派获取事件。
        // 启动时间取决于设备和条件。通常是50毫秒左右。而在手机平台上则是250毫秒。
        // 在极端的情况下(慢速设备，CPU故障)，时间可能超过500毫秒。
        // navigationPreload 会在service-worker启动的时候并行请求资源
        await self.registration.navigationPreload.enable();
      }
    })()
  );

  // Tell the active service worker to take control of the page immediately.
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  // console.log(event);
  // We only want to call event.respondWith() if this is a navigation request
  // for an HTML page.
  if (event.request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          // First, try to use the navigation preload response if it's supported.
          // FetchEvent.preloadResponse https://developer.mozilla.org/en-US/docs/Web/API/FetchEvent/PreloadResponse
          // 优先返回使用navigation preload返回
          const preloadResponse = await event.preloadResponse;
          if (preloadResponse) {
            return preloadResponse;
          }

          // Always try the network first.
          const networkResponse = await fetch(event.request);
          return networkResponse;
        } catch (error) {
          // catch is only triggered if an exception is thrown, which is likely
          // due to a network error.
          // If fetch() returns a valid HTTP response with a response code in
          // the 4xx or 5xx range, the catch() will NOT be called.
          console.log("Fetch failed; returning offline page instead.", error);
          // 如果预加载和网络都没办法获取response，那么使用本地缓存
          // 还有另一种方案：先加载缓存，如果没有缓存的话，加载网络
          const cache = await caches.open(CACHE_NAME);
          const cachedResponse = await cache.match(OFFLINE_URL);
          return cachedResponse;
        }
      })()
    );
  }

  // If our if() condition is false, then this fetch handler won't intercept the
  // request. If there are any other fetch handlers registered, they will get a
  // chance to call event.respondWith(). If no fetch handlers call
  // event.respondWith(), the request will be handled by the browser as if there
  // were no service worker involvement.
});
