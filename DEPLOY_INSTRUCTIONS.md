# 🚀 Hướng Dẫn Deploy Warehouse Management V2 Lên Matbao Hosting

## 📋 Chuẩn Bị Files

### 1. Files Cần Upload:
```
deploy-package/
├── .next/                 (Build output - copy từ project)
├── public/               (Static files - copy từ project)  
├── src/                  (Source code - copy từ project)
├── package.json          (Production dependencies)
├── next.config.mjs       (Next.js config)
├── server.js             (Startup file)
└── .env.local            (Production environment)
```

### 2. Tạo Archive:
- Zip toàn bộ thư mục `deploy-package`
- Đặt tên: `warehouse-v2-deploy.zip`

## 🌐 Deploy Lên Plesk

### Bước 1: Login Plesk Panel
```
URL: https://yourdomain.com:8443
Username: [Matbao cung cấp]
Password: [Matbao cung cấp]
```

### Bước 2: Cấu Hình Domain
1. **Chọn Domain** → **Websites & Domains**
2. **Click vào domain** của bạn

### Bước 3: Enable Node.js
1. **Vào "Node.js"** trong menu
2. **Enable Node.js**: ✅ ON
3. **Node.js Version**: 18.x hoặc 20.x
4. **Document Root**: `/httpdocs`
5. **Application Root**: `/httpdocs`
6. **Startup File**: `server.js`
7. **Click "Apply"**

### Bước 4: Upload Files
1. **Vào "Files"** → **File Manager**
2. **Navigate** đến `/httpdocs`
3. **Delete** tất cả files cũ (nếu có)
4. **Upload** file `warehouse-v2-deploy.zip`
5. **Extract** archive trong `/httpdocs`
6. **Move** tất cả files từ `deploy-package/` ra `/httpdocs/`

### Bước 5: Install Dependencies
1. **Vào "Node.js"** → **NPM**
2. **Click "Install"** để install dependencies
3. **Hoặc** sử dụng SSH:
   ```bash
   cd /var/www/vhosts/yourdomain.com/httpdocs
   npm install --production
   ```

### Bước 6: Cấu Hình Environment
1. **Edit file** `.env.local` trong File Manager
2. **Update** các thông tin:
   ```env
   NEXTAUTH_URL=https://yourdomain.com
   NEXTAUTH_SECRET=your_production_secret_here
   JWT_SECRET=your_jwt_secret_here
   ```

### Bước 7: Start Application
1. **Vào "Node.js"**
2. **Click "Restart App"**
3. **Hoặc** click **"Enable Production Mode"**

## 🔧 Troubleshooting

### Lỗi Thường Gặp:

#### 1. "Module not found"
```bash
# Solution: Install dependencies
npm install --production
```

#### 2. "Permission denied"
```bash
# Solution: Fix permissions
chmod -R 755 /var/www/vhosts/yourdomain.com/httpdocs
```

#### 3. "Port already in use"
```bash
# Solution: Restart Node.js app trong Plesk
```

#### 4. Database connection error
- Kiểm tra DB credentials trong `.env.local`
- Đảm bảo hosting có thể connect đến SQL Server

### Performance Optimization:

#### 1. Enable Gzip Compression:
- Vào **Apache & nginx Settings**
- Enable **gzip compression**

#### 2. Enable Caching:
- Vào **Caching**
- Enable **Browser caching**

#### 3. SSL Certificate:
- Vào **SSL/TLS Certificates**
- Install **Let's Encrypt** certificate

## 📊 Monitoring

### Check Application Status:
1. **Plesk** → **Node.js** → **Application Status**
2. **Logs**: Xem trong **Logs** section
3. **Performance**: Monitor trong **Statistics**

### Health Check URLs:
```
https://yourdomain.com/api/health
https://yourdomain.com/api/test-connection
```

## 🔐 Security

### 1. Environment Variables:
- Đổi tất cả secrets trong production
- Không commit `.env.local` vào git

### 2. Database Security:
- Sử dụng strong passwords
- Enable SSL connection

### 3. Application Security:
- Enable HTTPS
- Set secure headers
- Regular updates

## 📞 Support

### Matbao Support:
- **Hotline**: 1900 6680
- **Email**: support@matbao.net
- **Live Chat**: Trên website Matbao

### Application Issues:
- Check logs trong Plesk
- Verify environment variables
- Test database connection

## 🎉 Success!

Sau khi deploy thành công:
- **Website**: https://yourdomain.com
- **Login**: https://yourdomain.com/warehouse-v2/login
- **Admin**: admin / admin123

**🎯 Warehouse Management V2 đã sẵn sàng hoạt động trên production!**
