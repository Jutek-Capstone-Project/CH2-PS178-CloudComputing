# CH2-PS178-CloudComputing

**Tutorial penggunaan API Login dan Signup**:
1. Download direktori ini (bisa git clone atau download as zip)
2. Set Up Database
   * Buka terminal dulu, bs lewat Win+R atau buka cmd/powershell
   * Cek di device km udah ada mysql apa belum, bs coba "mysqld --version"
   * Kalau belum bisa cobaa install mysql duluu lewat sinii, https://dev.mysql.com/downloads/installer/
   * Kalau udah, masukin "mysqld --version" buat konfirm kalo udah ke download
   * Akses mysql di terminal: "mysql -u root -p"
   * Masukin password, kalo merasa belum pernah bikin password klik enter ajaa
   * Masukin "SHOW DATABASES" buat cek ada database apa ajaa so far
   * kalo belum ada bikin aja "CREATE DATABASE login_signup_auth;" buat bikin database baru
   * masukin "USE DATABASE login_signup_auth;" buat nge refer ke database yg baru dibikin itu
   * selanjutnya copy paste ajaa dari yang ada di database.sql
   * Nahh setelah ini bisa lanjut ke langkah selanjutnya
3. Buka Visual Studio Code, buka folder direktori ini
4. Di terminal VSCode, masukin command:
   * npm init --y
   * npm install
   * npm install express express-validator mysql2 dotenv jsonwebtoken bcrypt
   * node app.js 
5. Masukkan url berikut:
   * Sign Up: http://localhost:3000/api/signup
   * Login: http://localhost:3000/api/login
   * Get Data by Token: http://localhost:3000/api/profile
   * Refresh Token: http://localhost:3000/api/refresh

**Further Updates**
1. Ubah databasenya jd dari Cloud (tapi perlu konsen dari anggota lainnya dulu)
2. Deploy API nya melalui Vercel (kalau dirasa perlu)
