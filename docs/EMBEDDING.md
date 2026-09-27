# Adding MintBot to your website

This guide is for MintBot customers. It shows how to add the chat assistant and forms to any website. No coding knowledge is needed beyond copy-pasting a snippet.

> Replace `https://api.mintbot.app` in the examples below with the API domain shown in your dashboard's Embed tab — the snippet there is always ready to copy as-is.

---

## Chat assistant

The assistant appears as a chat bubble in the bottom-right corner of every page you add it to.

### 1. Get your snippet

In the MintBot dashboard, open your bot and go to the **Embed** tab. Your snippet looks like this:

```html
<script
  src="https://api.mintbot.app/widget.js"
  data-bot-id="mb_your_bot_key"
  defer
></script>
```

### 2. Paste it into your site

Paste the snippet just before the closing `</body>` tag of your page. To show it on every page, put it in your site's shared layout/template/footer.

That's it — reload your site and the chat bubble appears.

### Options

| Attribute | Purpose |
| --- | --- |
| `data-bot-id` | Your bot's public key (required) |
| `data-api` | Override the API host — only needed if MintBot support asks you to |

The bubble color, greeting message, and assistant name are all controlled from the dashboard (**Appearance** tab) — changes apply to your live site without touching the snippet again.

---

## Forms

Forms render inline, exactly where you place them on the page — for example a contact section.

### 1. Get your snippet

Open your form in the dashboard and go to the **Embed** tab:

```html
<div data-mintbot-form="mf_your_form_key"></div>
<script src="https://api.mintbot.app/form.js" defer></script>
```

### 2. Place it on the page

- Put the `<div>` where you want the form to appear.
- Put the `<script>` line once per page, anywhere (end of `<body>` is fine) — even if you embed several forms on the same page.

Submissions show up instantly in your dashboard under **Submissions**, with charts and a visitor map under **Insights**.

---

## Platform-specific instructions

### WordPress
Chat: install any "header and footer scripts" feature (many themes have Appearance → Theme settings → Footer scripts) and paste the chat snippet into the footer.
Form: add a **Custom HTML** block to a page and paste the full form snippet into it.

### Shopify
Online Store → Themes → Edit code → `theme.liquid`, paste the chat snippet right before `</body>`. For a form, add a **Custom Liquid** section to a page and paste the form snippet.

### Webflow
Project Settings → Custom Code → Footer Code for the chat snippet. For a form, drop an **Embed** element on the page and paste the form snippet.

### Wix
Settings → Custom Code → add the chat snippet to Body — End. For a form, add an **Embed HTML** element and paste the form snippet.

### Plain HTML site
Paste the snippets directly into your `.html` files as described above.

---

## Restricting where your embeds work

By default your bot and forms work on any website that has the snippet. To lock them to your own domains, open **Appearance** (bot) or **Builder → Settings** (form) in the dashboard and list your domains under **Allowed domains**, e.g.:

```
example.com
shop.example.com
```

Subdomains of a listed domain are allowed automatically (`www.example.com` counts as `example.com`).

---

## FAQ

**The chat bubble doesn't appear.**
Check that the snippet is on the page (view source and search for `widget.js`) and that `data-bot-id` matches the key in your Embed tab. If you set Allowed domains, make sure the current domain is listed.

**The form shows nothing.**
The `<div data-mintbot-form="...">` element must be on the page *and* the `form.js` script must be included. Check the form key.

**The assistant says it's "temporarily unavailable".**
Your monthly message quota is used up. Upgrade your plan or wait for the next month.

**Will it clash with my site's design?**
No. Both embeds render in an isolated container (Shadow DOM), so your site's CSS can't break them and they can't affect your styles. Colors and text are customized from the dashboard.

**Does it slow my site down?**
The scripts load with `defer`, after your page content, and are only a few kilobytes.

**How does the assistant know my content?**
It only answers from the sources you add in the dashboard (your website pages and pasted documents). Retrain a source after you update your site so answers stay current.
