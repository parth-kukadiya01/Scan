# 🚀 CardPulse Free Deployment Guide (Vercel + Render)

Deploy your **CardPulse Smart Business Card Scanner** completely free using **Vercel** (for the Next.js Frontend) and **Render** (for the FastAPI Python Backend).

---

## Architecture Overview

| Component | Platform | Free Tier Benefits |
|---|---|---|
| **Frontend** (Next.js 16 + React 19) | [Vercel](https://vercel.com) | Global Edge CDN, Free SSL, Instant deploys, Unlimited requests |
| **Backend** (FastAPI + Tesseract OCR) | [Render](https://render.com) | Free Docker Web Service, Linux container, Auto CI/CD |

---

## Step 1: Push Code to GitHub

Your local git repository is already initialized and committed on branch `main`.

1. Go to [GitHub](https://github.com/new) and create a **new repository** (e.g. `cardpulse` or `business-card-scanner`).
   > *Leave "Add README", ".gitignore", and "license" unchecked.*

2. Link your local repo and push to GitHub (replace `YOUR_USERNAME` and `YOUR_REPO_NAME`):
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git push -u origin main
   ```

---

## Step 2: Deploy Backend to Render (Free)

1. Log in to [dashboard.render.com](https://dashboard.render.com/) (sign in with your GitHub account).
2. Click **New +** in the top right, then select **Web Service**.
3. Select your GitHub repository (`cardpulse`).
4. Configure the settings:
   - **Name:** `cardpulse-backend`
   - **Region:** Choose the region nearest to you (e.g. Oregon, Frankfurt, Singapore)
   - **Branch:** `main`
   - **Root Directory:** `backend`
   - **Runtime:** `Docker`
   - **Instance Type:** `Free` ($0/month)
5. Click **Deploy Web Service**.
6. Render will automatically build the container (installing Python, FastAPI, and Tesseract OCR). Once deployment finishes, copy your live backend URL:
   ```
   https://cardpulse-backend-xxxx.onrender.com
   ```

> **Note on Render Free Tier:** Render free services spin down after 15 minutes of inactivity. When a request arrives, it wakes up automatically in ~30–45 seconds.

---

## Step 3: Deploy Frontend to Vercel (Free)

1. Log in to [vercel.com](https://vercel.com/) (sign in with your GitHub account).
2. Click **Add New...** -> **Project**.
3. Locate your GitHub repository and click **Import**.
4. Configure your project:
   - **Project Name:** `cardpulse`
   - **Framework Preset:** `Next.js`
   - **Root Directory:** Click **Edit** and select **`frontend`**
5. Expand **Environment Variables**:
   - **Key:** `NEXT_PUBLIC_API_URL`
   - **Value:** Paste your Render backend URL from Step 2:
     ```
     https://cardpulse-backend-xxxx.onrender.com
     ```
6. Click **Deploy**.
7. In ~30–45 seconds, your app will be live with a production URL like:
   ```
   https://cardpulse.vercel.app
   ```

---

## Step 4: Verify Your Live Deployment

1. Open your Vercel URL on your computer or mobile phone.
2. In the top navbar, you will see the green dot: **FastAPI Engine Active**.
3. Click any **Instant Demo** card (e.g. "Tech Executive") to verify end-to-end OCR and CSV addition!
4. Use your mobile phone camera to snap a business card in real-time, click **Download Excel (.xlsx)** or **Download CSV**, and export your contacts!


---

## Future Updates (Automatic CI/CD)

Any time you make improvements or changes to your code:
```bash
git add .
git commit -m "Update feature"
git push
```
Both **Vercel** and **Render** will automatically detect the push, rebuild, and redeploy your live sites with zero downtime!
