# Feedback walkthrough (now)

Open **https://allin-coach.vercel.app** on your phone (Safari → clear site data once if you still see the API key screen).

You do **not** need API keys on the phone. Send feedback as you go.

## Suggested path

1. Onboarding (ALL IN → baseline → protocol → skip mic → home)
2. Daily check-in
3. **Train** — start a strength or sprint log
4. **Fuel** — log macros / try a screenshot if you want
5. **Body** — review trends
6. **Coach** — ask a question (server-side AI)
7. **Settings** — voice, plans preview, backup

When you're happy with the product flow, say the word for the Apple / TestFlight build — you'll handle keys then while that ships.

---

# Later: Apple-ready deploy (when you say go)

You handle:
- Anthropic / Vercel env (already partly there)
- Apple Developer account items (bundle ID, IAP products, App Store Connect)

We handle:
- Expo / EAS native build
- TestFlight pipeline
- Subscription gate + IAP wiring
- Privacy / liability onboarding for App Store
