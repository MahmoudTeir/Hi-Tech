# 🔔 Push Notification System - هاي تك

## ✅ **What's New: Background Push Notifications**

Now you can send notifications that work **even when pages are closed**! 

### 🚀 **Two Notification Types:**

1. **Real-time SSE Notifications** (requires open pages)
   - Instant delivery when pages are open
   - Works across all connected browsers/devices
   - Uses Server-Sent Events

2. **Background Push Notifications** (works when pages closed!)
   - Service Worker based notifications
   - Appear even when browser/pages are completely closed
   - Persistent on mobile devices

## 📱 **How to Use Background Notifications:**

### **Step 1: Enable on User Devices**
Visit any of these pages and allow notifications:
- `http://10.10.10.196:3000/push-demo.html` (demo page)
- `http://10.10.10.196:3000/login.html` 
- `http://10.10.10.196:3000/status.html`
- `http://10.10.10.196:3000/watch.html`

### **Step 2: Send Background Notifications**
Use the admin panel or API:

**Admin Panel Method:**
1. Go to `http://10.10.10.196:3000/admin.html`
2. Login with admin credentials
3. Send notifications - they reach ALL devices (open or closed)

**API Method:**
```bash
curl -X POST http://10.10.10.196:3000/api/push/send \\
  -H "Content-Type: application/json" \\
  -d '{
    "token": "hitech_admin_2025",
    "notificationType": "maintenance_alert",
    "title": "صيانة النظام",
    "message": "سيتم إجراء صيانة للنظام خلال 10 دقائق",
    "priority": "urgent"
  }'
```

## 🔧 **API Endpoints:**

### Register for Push Notifications:
```
POST /api/push/subscribe
{
  "subscription": {...}, // Browser push subscription object
  "clientId": "unique_client_id"
}
```

### Send Background Push:
```
POST /api/push/send
{
  "token": "hitech_admin_2025",
  "notificationType": "maintenance_alert|service_announcement|connection_lost",
  "title": "Notification Title",
  "message": "Notification Message", 
  "priority": "normal|high|urgent"
}
```

### Regular SSE Notifications (for open pages):
```
POST /api/notifications/send
{
  "token": "hitech_admin_2025",
  "notificationType": "service_announcement",
  "title": "Title",
  "message": "Message",
  "duration": 300000,
  "displayDuration": 5,
  "priority": "normal"
}
```

## 📋 **Testing Instructions:**

### Test with Demo Page:
1. Open `http://10.10.10.196:3000/push-demo.html`
2. Click "تفعيل الإشعارات الخلفية"
3. Allow notifications when prompted
4. Click "إرسال إشعار خلفي"  
5. **Close the browser completely**
6. Use admin panel or API to send more notifications
7. **Notifications should still appear!**

### Test with Mobile:
1. Open any page on mobile: `http://10.10.10.196:3000/status.html`
2. Allow notifications when prompted
3. Close browser/app completely
4. Send notifications from admin panel
5. **Push notifications will appear on mobile!**

## ⚠️ **Important Notes:**

1. **Service Worker Required**: Push notifications need Service Worker support
2. **HTTPS in Production**: Push notifications require HTTPS in production environments
3. **Permission Required**: Users must explicitly allow notifications
4. **Network Access**: Mobile devices must be on same network as server
5. **Firewall**: Ensure port 3000 is accessible

## 🔐 **Security:**

- Admin token required: `hitech_admin_2025`
- Push subscriptions are stored temporarily in server memory
- No sensitive data is stored in notifications

## 📊 **Current Status:**

- ✅ Server running on `http://10.10.10.196:3000`
- ✅ SSE real-time notifications working
- ✅ Background push notifications working
- ✅ Mobile device support enabled
- ✅ Cross-device broadcasting functional

**Now you can send notifications that truly reach everyone, even when they're not actively browsing!** 🎉📱