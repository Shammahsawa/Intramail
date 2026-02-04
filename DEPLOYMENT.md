# FMC Hong Intramail - XAMPP/WAMP Deployment Guide

## Prerequisites
1.  **XAMPP** (or WAMP) installed and running (Apache & MySQL services started).
2.  **Node.js** installed (required only to build the frontend assets).

---

## Step 1: Prepare XAMPP

1.  Navigate to your XAMPP installation directory (usually `C:\xampp\htdocs`).
2.  Create a new folder named `intramail`.
    *   *Note: If you change this name, you must update `vite.config.ts` and `services/mockDatabase.ts`.*

---

## Step 2: Database Setup

1.  Open **phpMyAdmin** in your browser (`http://localhost/phpmyadmin`).
2.  Create a new database named `intramail_db`.
3.  Click **Import** tab.
4.  Choose the file `backend/database.sql` from this project and click **Go**.

---

## Step 3: Backend Setup

1.  Copy the `public/api` folder from your project source.
2.  Paste it into `C:\xampp\htdocs\intramail\`.
3.  You should now have: `C:\xampp\htdocs\intramail\api\index.php`.
4.  (Optional) If you have a password for MySQL, edit `api/index.php` and update the `$password` variable.

---

## Step 4: Frontend Build

Since browsers cannot read `.tsx` files directly, you must compile them into standard HTML/JS.

1.  Open your project terminal.
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Build the project:
    ```bash
    npm run build
    ```
4.  This will create a `dist` folder in your project directory.

---

## Step 5: Final Deployment

1.  Open the `dist` folder created in the previous step.
2.  Select **all files** inside `dist` (`index.html`, `assets` folder, etc.).
3.  Copy them to `C:\xampp\htdocs\intramail\`.

**Final Folder Structure in XAMPP:**
```
htdocs/
└── intramail/
    ├── api/
    │   └── index.php
    ├── assets/
    │   ├── index-Dx8s9s.js
    │   └── index-Cx8s9s.css
    ├── index.html
    └── vite.svg
```

---

## Step 6: Access the System

1.  Open your browser.
2.  Go to `http://localhost/intramail/`.
3.  Login with:
    *   Username: **shammah**
    *   Password: **12345678**

---

## Step 7: Local SMTP Configuration (For Email Notifications)

To enable the system to send email notifications (e.g., password resets, high-priority alerts) over the LAN without internet access, you need a local SMTP server.

### Option A: Ubuntu / Linux (Postfix)

1.  **Install Postfix:**
    ```bash
    sudo apt-get update
    sudo apt-get install postfix
    ```
2.  **Configuration Wizard:**
    *   When prompted, select **"Internet Site"**.
    *   System mail name: `fmchong.local`
3.  **Configure Postfix (`/etc/postfix/main.cf`):**
    *   Ensure the following settings are configured to allow local relay:
    ```conf
    inet_interfaces = all
    inet_protocols = ipv4
    mynetworks = 127.0.0.0/8 [::ffff:127.0.0.0]/104 [::1]/128 192.168.0.0/16
    ```
4.  **Restart Postfix:**
    ```bash
    sudo systemctl restart postfix
    ```

### Option B: Windows Server (hMailServer)

Since Postfix is native to Linux, **hMailServer** is the recommended open-source alternative for Windows.

1.  **Download & Install:**
    *   Download hMailServer from the official website.
    *   Run the installer and select "Server" and "Administrative Tools".
    *   Choose "Built-in database engine" (Microsoft SQL Compact) for simple setups.
2.  **Configure Domain:**
    *   Open hMailServer Administrator.
    *   Click **Add domain**.
    *   Domain: `fmchong.local`.
    *   Click **Save**.
3.  **Create Account:**
    *   Go to **Domains** > `fmchong.local` > **Accounts**.
    *   Click **Add**.
    *   Address: `noreply` (Full address: `noreply@fmchong.local`).
    *   Password: Set a strong password.
    *   Click **Save**.
4.  **SMTP Settings:**
    *   Go to **Settings** > **Protocols** > **SMTP**.
    *   Ensure "Delivery of e-mail" -> "Local host name" is `localhost` or your server IP.

### Configure PHP to use Local SMTP

Regardless of the OS, you must tell PHP how to send mail.

1.  Locate your `php.ini` file (e.g., `C:\xampp\php\php.ini`).
2.  Search for `[mail function]`.
3.  Update the settings:

    **For Windows:**
    ```ini
    [mail function]
    SMTP = localhost
    smtp_port = 25
    sendmail_from = noreply@fmchong.local
    ```

    **For Linux (Postfix):**
    ```ini
    [mail function]
    sendmail_path = /usr/sbin/sendmail -t -i
    ```
4.  **Restart Apache** via the XAMPP/WAMP Control Panel for changes to take effect.

---

## Troubleshooting
*   **Login Fails?** Check `http://localhost/intramail/api/index.php?action=users`. If this shows a 404, your folder structure is wrong. If it shows Database Error, check `api/index.php` credentials.
*   **White Screen?** Ensure you copied the contents of `dist` to `htdocs/intramail`, not the `dist` folder itself.
*   **Emails not sending?** Check the `mail.log` (Linux: `/var/log/mail.log`) or hMailServer Logs to ensure the SMTP server is accepting connections from PHP.