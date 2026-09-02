# masterroachi.com — DNS before the Cloudflare migration

Captured 2026-09-02 by querying public DNS (8.8.8.8), while the domain
was still on domains.co.za nameservers.

**This domain has live email.** Moving nameservers moves all DNS, not just the
website. Every record below marked KEEP must exist in Cloudflare before the
switch, or mail stops being delivered.

Current nameservers: `ns1.tld-ns.net`, `ns2.tld-ns.com`, `ns3.tld-ns.net`,
`ns4.tld-ns.com`

| Type | Name | Value | Notes |
| --- | --- | --- | --- |
| A | @ | 41.222.32.24 | Replaced by Cloudflare Pages |
| CNAME | www | masterroachi.com | Replaced by Cloudflare Pages |
| A | mail | 41.222.32.24 | **KEEP** — mail host |
| CNAME | webmail | mail.masterroachi.com | **KEEP** — webmail access |
| CNAME | ftp | masterroachi.com | Keep if FTP is used |
| A | * (wildcard) | 41.222.32.24 | Wildcard; decide whether to recreate |
| MX | @ | mx1.tld-mx.com (priority 10) | **KEEP** — mail delivery |
| TXT | @ | `v=spf1 +a +mx include:_spf.tld-mx.com ~all` | **KEEP** — SPF |
| TXT | @ | `openai-domain-verification=dv-J9mcphUlvkvKb8AgoBQfeIWa` | Keep |
| TXT | default._domainkey | (DKIM key, below) | **KEEP** — DKIM signing |

## DKIM record

Cloudflare's scanner often misses this one, because `default._domainkey` is a
selector it has to guess. Check for it explicitly, and paste this value if it
is absent — Cloudflare handles splitting it across the 255-character limit.

```
v=DKIM1;k=rsa;p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAw7jELoClF1oZyePQW/8298j/7cYN4Pecb8IVwQW3+4w2KPXEt6sc1MDISJHaQDOecjsJdZYrF4qjj+pRkiu+aR0dU3H6qElzOWnv2mm5VQcxmYAHKhOa4neiXcWoLGB+D1YBqPr8b/zos5S6BUXxanXD61Dl3C40h2YaBihBazXKWgD4jriKHvJgNqUAiSBOl3lDGU7gAPsD4DEU36uhyVWeX8EoFCBZSUDkGZfeVGGBQijIydmteY0ZWXu1T3cnP+PBcnw4jOIcHwQ8y0HM3uYbohWHOiCYGZpfNBwg69nMXhYrN+XI8i70QkScUD5X5UvRyDXtVJidrVcYnVepFQIDAQAB;
```

## Note on SPF

The SPF record includes `+a`, which authorises whatever the apex A record
points at. Once the apex points at Cloudflare Pages instead of the mail host,
`+a` no longer covers the mail server — `+mx` and the `include` still do, so
delivery keeps working, but tightening this to drop `+a` is worth doing later.

---

## Outcome

**These mail records were deliberately abandoned, not migrated.** The addresses
were stale, so the domain moved to Cloudflare Email Routing instead — a
forwarding address to an existing inbox, with Cloudflare managing its own MX
and SPF records.

This file is kept only as a record of what the zone looked like beforehand, in
case something turns out to have depended on it. Nothing here needs recreating.

The one record carried forward is the OpenAI verification TXT, which was
unrelated to mail.
