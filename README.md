# Smart Email Builder (RAG + Gemini)

Ek Next.js app jo tumhare company ke real email tone/templates ko RAG ke through
retrieve karke, Gemini se properly toned client email generate karti hy. Sirf
email-related requests handle karti hy — baaki sab politely refuse karti hy.

---

## 1. Prerequisites

- Node.js 18+ installed
- Ek [Supabase](https://supabase.com) account (free tier kaafi hy)
- Ek [Google AI Studio](https://aistudio.google.com/app/apikey) Gemini API key
- GitHub account (Vercel deploy ke liye)

---

## 2. Supabase project setup

1. supabase.com pe naya project banao.
2. Project khulne k baad, **SQL Editor** > **New query** mein jao.
3. `supabase/schema.sql` ka pura content copy karke run karo. Ye:
   - `vector` extension enable karega
   - `email_templates` table banayega (embeddings store karne k liye)
   - `match_email_templates` function banayega (similarity search)
4. **Authentication > Providers** mein jao aur confirm karo ke **Email** provider enabled hy (default enabled hota hy).
5. **Project Settings > API** mein jao aur ye 3 cheezein copy karlo:
   - Project URL
   - `anon public` key
   - `service_role` key (secret — kabhi client-side expose mat karna)

---

## 3. Local setup

```bash
cd smart-email-builder
npm install
cp .env.example .env.local
```

`.env.local` khol k apni values daalo:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
GEMINI_API_KEY=...
```

---

## 4. Seed the dataset (RAG data)

`dataset/email_templates.csv` mein 10 sample scenarios already hain (angry
client, discount request, escalation, invoice reminder, etc). Isko apne real
company scenarios se expand/edit kar sakte ho — bas same columns rakhna:
`scenario,client_type,tone,context,sample_email`

Phir seed script chalao — ye har row ko Gemini se embed karke Supabase mein
insert karega:

```bash
npm run seed
```

Terminal mein "Row X/10 inserted" dikhna chahiye. Supabase dashboard > Table
Editor > `email_templates` mein data check kar sakte ho.

---

## 5. Run locally

```bash
npm run dev
```

- `localhost:3000` pe signup karo (kisi bhi email/password se — confirmation
  email aayega, agar Supabase email confirmation on hy to link click karo)
- Login karo, dashboard pe pahunch jaoge
- Ek prompt daal k test karo, jese:
  > "Client bohat ghussa hy k delivery 1 week late hui, usko calm karna hy aur 3 din ka time chahiye"
- Kuch unrelated daal k bhi test karo (jese "write me a poem") — out of context
  refusal message aana chahiye

---

## 6. Push to GitHub

```bash
git init
git add .
git commit -m "Smart Email Builder - initial version"
git branch -M main
git remote add origin https://github.com/<your-username>/smart-email-builder.git
git push -u origin main
```

---

## 7. Deploy on Vercel

1. [vercel.com](https://vercel.com) pe login karo (GitHub se)
2. **Add New > Project** > apna GitHub repo select karo
3. Environment Variables section mein wahi 4 values daalo jo `.env.local` mein
   thi (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`)
4. **Deploy** click karo

---

## 8. Post-deploy (important)

Vercel domain mil jane k baad (e.g. `smart-email-builder.vercel.app`):

1. Supabase dashboard > **Authentication > URL Configuration** mein jao
2. **Site URL** ko apne Vercel domain se update karo
3. **Redirect URLs** mein bhi Vercel domain add karo

Isके bina signup confirmation links locally redirect karenge, production pe nahi.

---

## 9. Admin approval + prompt logging setup

Ye feature har prompt (kisne bheja, kya input tha, kya output aya) ko log karta
hy, aur naye signups ko admin approval ke bina dashboard use nahi karne deta.

1. Supabase SQL Editor mein `supabase/schema_v2_admin_approval.sql` ka pura
   content run karo (ye additive hy, `email_templates` table ko touch nahi
   karta).
2. Apne aap ko signup karo app mein (agar already nahi kiya) — name + email +
   password se.
3. Email confirm karo.
4. Supabase SQL Editor mein khud ko admin banao:
   ```sql
   update profiles set is_admin = true, is_approved = true
   where email = 'your-email@example.com';
   ```
5. Ab `/admin` route pe jao (login karke) — wahan tumhe pending signups aur
   sab prompt logs dikhengi.
6. Koi naya team member signup kare tou wo `/pending` page pe atka rahega jab
   tak tum `/admin` se unko "Approve" nahi kar dete.

**Note:** Sirf ek hi admin ho sakta hy shuru mein (manually SQL se set kiya
hua). Wo admin baad mein `/admin` page se dusre users ko approve/revoke kar
sakta hy, lekin kisi ko admin banane ke liye abhi bhi SQL Editor use karna
hoga (`update profiles set is_admin = true where email = '...'`).

---

## How the RAG + guardrail actually works

1. User prompt aata hy → Gemini se uska embedding banta hy
2. Supabase pgvector `match_email_templates` function se top-3 similar
   scenarios retrieve hote hain (`lib/rag.ts`)
3. Agar best match ki similarity threshold se kam hy → seedha refuse (out of
   context), Gemini call bhi nahi hoti
4. Agar match theek hy → retrieved examples ko ek strict system prompt mein
   daal k Gemini ko diya jata hy, jisme explicitly likha hy: sirf email likhni
   hy, kuch aur nahi, aur unrelated request pe fix refusal message dena hy
5. Ye do-layer guardrail hy: (a) similarity threshold, (b) system prompt rule
   — dono independently kaam karte hain

## Customizing tone/dataset

Bas `dataset/email_templates.csv` edit karo aur `npm run seed` dobara chalao
(purane rows duplicate ho jayenge agar dobara run kiya — chaho to Supabase
table editor se purane clear kar k fresh seed karlo).
