# 🔒 GitHub Push Protection - Secrets in History

## Problem
GitHub detected secrets (GCP API Key) in **previous commits** in your git history.
The `.env` file is correctly ignored now, but the secrets exist in old commits.

## Solution

### OPTION 1: Allow Secret on GitHub (Quickest)

Since you've already removed secrets from your current code:

1. **Visit the unblock URL:**
   ```
   https://github.com/Shivam-3110/GREEN-WATCH-AI/security/secret-scanning/unblock-secret/3FJGSYjVUTbqIRXUt94E3DToXDx
   ```

2. **Click "Allow"** (or "Unblock")

3. **Try pushing again:**
   ```bash
   git push origin main:main
   ```

✅ This works because the secret is no longer in your current code.

---

### OPTION 2: Remove from Git History (Most Secure)

If you want to completely remove the secret from git history:

#### Using git-filter-repo (Recommended)

```bash
# 1. Install git-filter-repo
pip install git-filter-repo

# 2. Remove the specific secret
git filter-repo --replace-text <(echo 'AQ.Ab8RN6J9Os2DAaAWxwdXo1_1it3jEF39OOSkbxUr8o7twce98Q===')

# 3. Force push
git push origin main --force-with-lease
```

#### Using BFG (Alternative)

```bash
# 1. Download BFG: https://rtyley.github.io/bfg-repo-cleaner/

# 2. Create file with secret to replace
echo "AQ.Ab8RN6J9Os2DAaAWxwdXo1_1it3jEF39OOSkbxUr8o7twce98Q===" > secrets.txt

# 3. Run BFG
bfg --replace-text secrets.txt

# 4. Clean and push
git reflog expire --expire=now --all
git gc --prune=now --aggressive
git push origin main --force-with-lease
```

#### Using git-filter-branch (Manual)

```bash
# For each commit containing the secret:
git filter-branch --tree-filter 'sed -i "s/AQ.Ab8RN6J9Os2DAaAWxwdXo1_1it3jEF39OOSkbxUr8o7twce98Q/REDACTED/g" backend/.env' HEAD

# Force push
git push origin main --force-with-lease
```

---

## ⚡ RECOMMENDED QUICK FIX

Since your current code is clean, use **OPTION 1** (Allow on GitHub):

1. Click: https://github.com/Shivam-3110/GREEN-WATCH-AI/security/secret-scanning/unblock-secret/3FJGSYjVUTbqIRXUt94E3DToXDx
2. Click "Allow"
3. Run: `git push origin main:main`

Done! ✅

---

## 🔑 Rotate Your Compromised Keys

Even if you allow it on GitHub, **rotate the exposed keys immediately:**

### Rotate Gemini API Key
1. Go to: https://aistudio.google.com/app/apikey
2. Delete the exposed key
3. Create a new one
4. Update your `.env` file locally with the new key
5. Never commit it to git

### Rotate JWT Secret
1. Generate new: `openssl rand -hex 32`
2. Update in your `.env` locally
3. Deploy to production

---

## ✅ Verification

After pushing, verify the push succeeded:

```bash
# Check remote branch
git log origin/main --oneline | head -5

# Should show your latest commits
```

---

## 📋 Security Checklist

- ✅ `.env` file removed from current working directory tracking
- ✅ `.env` added to `.gitignore`
- ✅ `.env.example` created with placeholders
- ⚠️ Rotate exposed keys (Gemini + JWT)
- ⚠️ Allow secret on GitHub OR clean git history
- ✅ Push to main branch

---

## 🆘 If Still Blocked

1. **Check git history for secrets:**
   ```bash
   git log --all -p | grep -i "GEMINI_API_KEY\|AQ.Ab8RN6J9"
   ```

2. **If found, use git-filter-repo** (OPTION 2 above)

3. **Contact GitHub Support** if needed

---

## Resources

- [GitHub Push Protection](https://docs.github.com/code-security/secret-scanning/working-with-secret-scanning-and-push-protection/working-with-push-protection-from-the-command-line)
- [git-filter-repo](https://github.com/newren/git-filter-repo)
- [BFG Repo-Cleaner](https://rtyley.github.io/bfg-repo-cleaner/)

---

## Summary

| Step | Status | Action |
|------|--------|--------|
| Remove secret from current code | ✅ Done | `.env` file cleaned |
| Clean git history | ⚠️ Pending | Use OPTION 1 or 2 |
| Rotate keys | ⚠️ Pending | Get new API keys |
| Push to GitHub | ⚠️ Pending | `git push origin main:main` |

**Next:** Click the GitHub link in OPTION 1 and push! 🚀
