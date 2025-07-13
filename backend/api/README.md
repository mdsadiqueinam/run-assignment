# api

GraphQL API Server for Ruh Care

## Usage

Copy .env.example to .env and configure

## Installation

```
pnpm i
pnpm start
```

POSTGRAPHILE_API_DEFAULT_ROLE=app_user

## NOTE on POSTGRAPHILE_API_DEFAULT_ROLE

IN dev, set for POSTGRAPHILE_API_DEFAULT_ROLE=app_user upi want to make an app_user:

CREATE USER app_user WITH PASSWORD 'Aa123456';
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;

## Example middleware we might want to put in front of PostGraphile \*/

app.use(require('morgan')(...));
app.use(require('compression')({...}));
app.use(require('helmet')({...}));

Consider:

pgSettings: {
statement_timeout: "3000",
},

# Graphiql

You can see a nice UI running in dev at http://localhost:4000/graphiql
