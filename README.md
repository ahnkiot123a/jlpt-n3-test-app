This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

### PDF and audio files

The exam PDFs and audio are stored outside this app, so they are not included in a Vercel deployment. Put them in a public Cloudflare R2 bucket and set `EXAM_ASSET_BASE_URL` in the Vercel project to the bucket's HTTPS custom-domain URL (without a file path, query, or fragment). The API redirects PDF and audio requests to R2, which serves large files and audio range requests directly.

From the `web` directory, install and configure the [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html) with an R2 access key that can write to your bucket, then upload the exam files:

```bash
export CLOUDFLARE_ACCOUNT_ID="your-account-id"
export R2_BUCKET="your-bucket-name"
export AWS_ACCESS_KEY_ID="your-r2-access-key-id"
export AWS_SECRET_ACCESS_KEY="your-r2-secret-access-key"

ASSET_DIR=$(find .. -maxdepth 1 -type d -name 'N3_*' -print -quit)
if [ -z "$ASSET_DIR" ]; then
  echo "Exam asset folder not found next to web/" >&2
  exit 1
fi
ASSET_PREFIX=$(basename "$ASSET_DIR")

aws s3 sync "$ASSET_DIR/" "s3://$R2_BUCKET/$ASSET_PREFIX/" \
  --endpoint-url "https://${CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com" \
  --exclude "*.rar"
```

Attach a public custom domain to the R2 bucket, then add `EXAM_ASSET_BASE_URL` with that domain (for example, `https://media.example.com`) under **Vercel → Project Settings → Environment Variables** and redeploy. Keep the R2 write credentials local; they are not needed by the deployed app. Without `EXAM_ASSET_BASE_URL`, the app continues to read the files from the sibling `N3_*` folder during local development.
