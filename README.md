# supabase-template

## Get started

### 1. Clone this repo

### 2. Install dependencies, including the Supabase CLI

```bash
yarn
```

**Note**: If you install the Supabase CLI using a different method you have to make sure you are on version 1.49.4 as more recent versions currently suffer from an issue which prevents this from working correctly.

### 3. Create frontend env file

```bash
cp .env.example .env.local
```

### 4. Update environment variables in `.env.local`

```
# Change this to your Stripe Keys
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=PUBLISHABLE_KEY
STRIPE_SECRET_KEY=SECRET_KEY
STRIPE_WEBHOOK_SECRET=WEBHOOK_KEY

# Change this to your OPEN AI API Key
OPENAI_API_KEY=YOUR_OPENAI_API_KEY
```

Open AI

    - Go to this link https://platform.openai.com/account/api-keys
    - Log in / Sign up
    - Create new secret key
    - Copy Key and Paste to OPEN_API_KEY

Stripe

- Go to this link https://dashboard.stripe.com/
- Log in / Sign up
- On the dashboard, make sure you are on "Test Mode", then
  - copy "Publishable key" to "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"
  - copy "Secret key" to "STRIPE_SECRET_KEY"
- Create active product with 1 recurring price
  - copy Price "API ID" to "STRIPE_PRICE_ID"
- Make sure you activate "Customer Portal Link" [here](https://dashboard.stripe.com/test/settings/billing/portal). This will make a customer portal to cancel plans etc.

### 5. Create OAuth Access from google cloud console

- Go to your google cloud console
- Search `OAuth`
- Open OAuth consent screen
- Select your Project on the top left screen
- Select external and create
- Fill up form and add test users
- Open Credentials Page (on the left side corner)
- Create Credentials, OAuth client ID
- Select web application
- Fill up form and add to "Authorized redirect URIs" this link `http://localhost:50321/auth/v1/callback`
- Copy and Save client ID and Secret

### 6. Start Stripe Webhook redirection to localhost

- Install Stripe CLI [https://stripe.com/docs/stripe-cli](https://stripe.com/docs/stripe-cli)

```bash
brew install stripe/stripe-cli/stripe -- only Mac Homebrew
stripe login
```

- Forward webhook to local path

```bash
 stripe listen --forward-to localhost:3100/api/stripe/webhook
```

Take the `webhook signing secret` and use as `STRIPE_WEBHOOK_SECRET` in `.env.local`

### 7. Create supabase functions env file, Add to the .env file the keys you've generated from google cloud

```bash
cp supabase/.env.example supabase/.env
```

### 8. Start Docker

Open Docker Desktop

If you encounter docker issues on Mac,

```
sudo ln -s ~/.docker/run/docker.sock /var/run/docker.sock
```

[blog post](https://thepatricktran.com/2023/05/13/mac-and-docker-desktop-cannot-connect-to-the-docker-daemon/)

### 9. Start the supabase project

```bash
yarn supabase:start
```

**Note**: If you have an existing database and want to reset the db or update the db you can use this command

```bash
yarn supabase:reset
```

Dashboard: `http://localhost:50323/projects`. Set in `config.toml`

### 10. Start the frontend build watcher locally

```bash
yarn dev
```

### 11. Open [http://localhost:3100](http://localhost:3100) with your browser to see the result.

## Deploy

1. Create a new project on [Supabase](https://supabase.io)

- Add the Google provider

2. Create a new project on [Vercel](https://vercel.com)

- Set all the same environment variables as `.env.local`

3. To deploy the frontend, connect your Vercel project to your GitHub repo and push to main.

4. To deploy the supabase functions, first login to Supabase:

```bash
npx supabase login
```

Then, link your project:

```bash
npx env-cmd -f ./supabase/.env npx supabase link --project-ref <project-ref>
```

Optionally, if you're also using the Supabase Vector Store from LangChain, you'll need to push the schema to the database:

```bash
supabase db push
```

## How to debug vercel

Q: Where are the logs?
