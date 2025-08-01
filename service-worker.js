const CACHE_NAME = 'iran-laws-cache-v1';
// لیست تمام فایل‌هایی که می‌خواهیم کش شوند
const urlsToCache = [
    './', // صفحه اصلی
    './index.html',
    './manifest.json',
    'https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;700&display=swap',
    'https://fonts.gstatic.com/s/vazirmatn/v1/Vazirmtn-Regular.woff2', // مثال: فونت‌های واقعی
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css',
    'https://cdnjs.cloudflare.com/ajax/libs/lz-string/1.4.4/lz-string.min.js',
    // فایل‌های XML قوانین - اینها به صورت پویا توسط IndexedDB کش می‌شوند
    // 'madani/madani.xml', // اینها در زمان اجرا توسط IndexedDB مدیریت می‌شوند
    // 'shora/shora.xml',
    // ...
];

// هنگام نصب سرویس ورکر، فایل‌های اصلی را کش کن
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
    );
});

// هنگام فعال‌سازی سرویس ورکر، کش‌های قدیمی را پاک کن
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// هنگام درخواست شبکه، ابتدا از کش پاسخ بده، سپس شبکه را امتحان کن (Cache First, then Network)
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // اگر در کش بود، از کش برگردان
                if (response) {
                    return response;
                }
                // در غیر این صورت، از شبکه فچ کن
                return fetch(event.request).then(
                    networkResponse => {
                        // اگر پاسخ شبکه معتبر بود، آن را در کش ذخیره کن
                        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                            return networkResponse;
                        }
                        const responseToCache = networkResponse.clone();
                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            });
                        return networkResponse;
                    }
                ).catch(error => {
                    console.error('Fetch failed for:', event.request.url, error);
                    // می‌توانید یک صفحه آفلاین سفارشی را اینجا برگردانید
                    // return caches.match('/offline.html'); 
                });
            })
    );
});
