# Custom Domain Setup for motionsdata.me

## Your Domain: motionsdata.me

### DNS Configuration

Configure the following DNS records with your domain registrar:

#### Option 1: Apex Domain (motionsdata.me) + www subdomain
```
Type    Name    Value                          TTL
A       @       185.199.108.153                3600
A       @       185.199.109.153                3600
A       @       185.199.110.153                3600
A       @       185.199.111.153                3600
CNAME   www     10310229-ai.github.io          3600
```

#### Option 2: Using www only (www.motionsdata.me)
```
Type    Name    Value                          TTL
CNAME   www     10310229-ai.github.io          3600
```

### GitHub Pages Configuration

1. **Push CNAME file:**
   ```bash
   git add CNAME
   git commit -m "Add custom domain motionsdata.me"
   git push origin main
   git checkout gh-pages
   git merge main
   git push origin gh-pages
   ```

2. **Configure in GitHub:**
   - Go to: https://github.com/10310229-ai/motiondata/settings/pages
   - Under "Custom domain", enter: `motionsdata.me`
   - Click Save
   - Wait for DNS check to complete (may take a few minutes)
   - Enable "Enforce HTTPS" once DNS is verified

### DNS Provider Instructions

#### Common Providers:

**Namecheap:**
1. Go to Domain List → Manage
2. Advanced DNS tab
3. Add the A and CNAME records above

**GoDaddy:**
1. My Products → DNS
2. Add Records
3. Add the A and CNAME records above

**Cloudflare:**
1. DNS → Records
2. Add the A and CNAME records above
3. Set Proxy status to "DNS only" (gray cloud)

**Google Domains:**
1. DNS → Custom records
2. Add the A and CNAME records above

### Verification

After DNS propagation (can take up to 48 hours, usually 10-30 minutes):

1. **Check DNS:**
   ```bash
   nslookup motionsdata.me
   nslookup www.motionsdata.me
   ```

2. **Test Website:**
   - http://motionsdata.me
   - https://motionsdata.me
   - http://www.motionsdata.me
   - https://www.motionsdata.me

### SSL Certificate

GitHub Pages will automatically provision a free SSL certificate once:
- DNS is properly configured
- Domain is verified in GitHub settings
- "Enforce HTTPS" is enabled

This usually takes 5-10 minutes after DNS verification.

### Troubleshooting

**DNS not resolving:**
- Wait longer (up to 48 hours max)
- Clear DNS cache: `ipconfig /flushdns` (Windows) or `sudo dscacheutil -flushcache` (Mac)
- Check DNS propagation: https://dnschecker.org

**Certificate errors:**
- Ensure DNS points correctly to GitHub Pages IPs
- Wait for GitHub to provision certificate
- Try disabling and re-enabling "Enforce HTTPS"

**404 errors:**
- Ensure CNAME file is in gh-pages branch
- Verify custom domain in GitHub Pages settings
- Check repository is public

### Current Status

- ✅ CNAME file created
- ⏳ Pending: DNS configuration at your registrar
- ⏳ Pending: GitHub Pages custom domain setup
- ⏳ Pending: SSL certificate provisioning

### Next Steps

1. Configure DNS records at your domain registrar
2. Push CNAME file to GitHub (instructions below)
3. Configure custom domain in GitHub Pages settings
4. Wait for DNS propagation
5. Enable HTTPS

Your website will then be live at:
- https://motionsdata.me
- https://www.motionsdata.me
