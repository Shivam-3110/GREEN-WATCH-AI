# 🔒 Fix GitHub Push Protection - Remove Secrets from Git History

## Problem
GitHub detected exposed secrets (GCP API Key) in your commits.

## Solution

### Option 1: Remove Secret from Last Commit (Recommended if uncommitted)

```bash
# Amend the last commit to remove secrets
git add backend/.env
git commit --amend --no-edit

# Force push (only if you haven't pushed yet)
git push origin main --force-with-lease
```

### Option 2: Use BFG Repo-Cleaner (If already pushed)

```bash
# 1. Install BFG
# Download from: https://rtyley.github.io/bfg-repo-cleaner/

# 2. Create a file with patterns to remove
# secrets.txt containing:
GEMINI_API_KEY=AQ.Ab8RN6J9Os2DAaAWxwdXo1_1it3jEF39OOSkbxUr8o7twce98Q
JWT_SECRET=e75d0c08091686f1cf1f51ad068235ea8bfd0072d08dc78be19d7049ba624a6d

# 3. Run BFG
bfg --replace-text secrets.txt

# 4. Force push
git push --force-with-lease
```

### Option 3: Use GitHub's Secret Scanning Interface

1. Go to: https://github.com/Shivam-3110/GREEN-WATCH-AI/security/secret-scanning
2. Click on the blocked secret
3. Click "Allow" if you trust it or "Revoke" to remove from history

### Step-by-Step Guide

**Step 1: Remove secrets from current .env**
✅ Already done - .env now has placeholders

**Step 2: Stage the cleaned .env**
```bash
git add backend/.env
```

**Step 3: Commit the changes**
```bash
git commit -m "🔒 Remove secrets from .env - use .env.example"
```

**Step 4: Try pushing again**
```bash
git push origin main:main
```

**Step 5: If still blocked, revoke the secret**
- Visit: https://github.com/Shivam-3110/GREEN-WATCH-AI/security/secret-scanning/unblock-secret/3FJGSYjVUTbqIRXUt94E3DToXDx
- Click "Allow" after you've rotated the actual keys

## ✅ Security Best Practices

### DO:
- ✅ Add `.env` to `.gitignore`
- ✅ Create `.env.example` with placeholders
- ✅ Use `.env.local` for local development
- ✅ Rotate compromised keys immediately
- ✅ Use GitHub Secrets for CI/CD
- ✅ Enable push protection globally

### DON'T:
- ❌ Commit `.env` files
- ❌ Hardcode secrets in code
- ❌ Share API keys in chat/email
- ❌ Use same keys across environments
- ❌ Disable push protection

## 🔑 Rotate Compromised Keys

Since these keys were exposed, rotate them:

**Gemini API Key:**
1. Go to: https://aistudio.google.com/app/apikey
2. Delete old key
3. Create new key
4. Update locally in `.env`

**JWT Secret:**
1. Generate new random string: `openssl rand -hex 32`
2. Update in local `.env`
3. Update in production environment

## 📝 Local Setup

```bash
# 1. Copy example to .env
cp backend/.env.example backend/.env

# 2. Add your actual secrets to .env (local only)
GEMINI_API_KEY=AIzaSyXXXXXXX...
JWT_SECRET=your_new_secret_here

# 3. Never commit .env again
git status  # Should show .env is ignored
```

## ✅ Verify Git is Clean

```bash
# Check for any secrets in current branch
git log --all -p | grep -i "gemini\|jwt_secret"

# If nothing appears, you're good to push
git push origin main:main
```

## 🆘 Still Having Issues?

1. **Check if .env is in gitignore:**
   ```bash
   git check-ignore -v backend/.env
   ```

2. **Remove from git cache:**
   ```bash
   git rm --cached backend/.env
   git commit -m "🔒 Stop tracking .env file"
   ```

3. **If history is compromised:**
   - Use BFG Repo-Cleaner (see above)
   - Or contact GitHub support

## Resources

- [GitHub Push Protection](https://docs.github.com/code-security/secret-scanning/working-with-secret-scanning-and-push-protection)
- [BFG Repo-Cleaner](https://rtyley.github.io/bfg-repo-cleaner/)
- [Git Secrets Tutorial](https://docs.github.com/en/code-security/secret-scanning/working-with-secret-scanning-at-the-command-line)

---

**Summary:**
1. ✅ .env cleaned with placeholders
2. ✅ .env.example created for reference
3. ✅ Next: `git add backend/.env && git commit --amend --no-edit && git push origin main:main`
