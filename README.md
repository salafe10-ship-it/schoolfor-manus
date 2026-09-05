<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/a11115e8-15f0-42ff-9bf6-8aeb12078f65

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Production release gate

Before deploying staging or production, populate the deployment secret manager
and run `npm run production:gate`. The gate validates the environment, tenant
and control-plane connections, restricted database role, TLS verification,
public HTTPS URL, and disabled AI forecasting defaults without printing secret
values. A failed gate is an intentional release blocker.

The data-plane role contract is explicit: Staging must connect as
`edupro_staging_app` and Production as `edupro_app`. Apply the ordered Supabase
migrations (including `202609031100_staging_app_role.sql`,
`202609031200_fixed_assets_canonical.sql`, and
`202609031300_uniform_inventory_sales.sql`) through the approved
database release process before supplying the corresponding `DATABASE_URL`.
The application does not create roles or run migrations at startup.
Use [.env.staging.example](C:/Users/admin/Desktop/SchoolForManus/edupro-school-erp-source/.env.staging.example)
or [.env.production.example](C:/Users/admin/Desktop/SchoolForManus/edupro-school-erp-source/.env.production.example)
as the non-secret configuration checklist.
